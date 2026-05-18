
using Google.GenAI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.OpenApi.Models;
using Scalar.AspNetCore;
using System.IO.Compression;
using System.Reflection;
using XCan.Core.Implementations;
using XCan.Core.Interfaces;
using XCan.Core.Options;

namespace XCan.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "XCan APIs Documentation",
                    Version = "v1.0.0",
                    Description = "Developed by Phan Xuan Quang."
                });

                c.UseAllOfToExtendReferenceSchemas();

                c.MapType<ProblemDetails>(() => new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = "ProblemDetails" } });
                c.MapType<ValidationProblemDetails>(() => new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = "ValidationProblemDetails" } });
                c.MapType<SerializableError>(() => new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = "SerializableError" } });

                c.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
                {
                    Name = "X-Api-Key",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Description = "API key required to access the endpoints. Pass it in the 'X-Api-Key' request header."
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "ApiKey"
                            }
                        },
                        []
                    }
                });

                string xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                string xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                c.IncludeXmlComments(xmlPath);
            });

            builder.Services.AddHttpContextAccessor();

            builder.Services.Configure<GeminiOptions>(builder.Configuration.GetSection("GeminiOptions"));

            builder.Services.AddScoped<Client>(sp =>
            {
                var httpContext = sp.GetRequiredService<IHttpContextAccessor>().HttpContext;
                var apiKey = httpContext?.Request.Headers["X-Api-Key"].FirstOrDefault()
                    ?? throw new InvalidOperationException("The 'X-Api-Key' request header is required.");
                return new Client(apiKey: apiKey);
            });

            builder.Services.AddScoped<IGenerativeAiService, GeminiAiService>();
            builder.Services.AddScoped<IOcrService, GeminiOcrService>();

            builder.Services.AddResponseCompression(options =>
            {
                options.Providers.Add<GzipCompressionProvider>();
                options.Providers.Add<BrotliCompressionProvider>();
            });

            builder.Services.Configure<GzipCompressionProviderOptions>(options =>
            {
                options.Level = CompressionLevel.Optimal;
            });

            builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
            {
                options.Level = CompressionLevel.Optimal;
            });

            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policyBuilder =>
                {
                    policyBuilder
                        .WithOrigins("https://xcan.vercel.app")
                        //.AllowAnyOrigin()
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            var app = builder.Build();

            app.UseCors();
            app.UseSwagger(options =>
            {
                options.RouteTemplate = "openapi/{documentName}.json";
            });

            app.MapScalarApiReference(options =>
            {
                // Link to the JSON generated above
                options.WithOpenApiRoutePattern("/openapi/v1.json");

                // Optional: Customize theme (e.g., "purple", "solarized", "bluePlanet")
                options.WithTheme(ScalarTheme.Mars);
            });


            app.UseHttpsRedirection();

            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
