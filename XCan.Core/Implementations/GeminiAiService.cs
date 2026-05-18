using Google.GenAI;
using Google.GenAI.Types;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using XCan.Core.Interfaces;
using XCan.Core.Options;

namespace XCan.Core.Implementations;

public class GeminiAiService : IGenerativeAiService
{
    private readonly ILogger<GeminiAiService> _logger;
    private readonly Client _client;
    private readonly string _model;

    public GeminiAiService(Client client, IOptions<GeminiOptions> options, ILogger<GeminiAiService>? logger = null)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _client = client ?? throw new ArgumentNullException(nameof(client));
        _model = options?.Value.ModelName ?? throw new ArgumentNullException(nameof(options));
    }

    public async Task<(bool Success, Exception? Error)> ValidateApiKeyAsync(string apiKey, CancellationToken cancellationToken = default)
    {
        try
        {
            var contents = new List<Content>
            {
                new() {
                    Role = "user",
                    Parts =
                    [
                        new Part { Text = "Please say *Hello World*." },
                    ]
                }
            };

            var result = await _client.Models.GenerateContentAsync(
                _model,
                contents,
                new GenerateContentConfig
                {
                    Temperature = 0.1,
                    ThinkingConfig = new ThinkingConfig
                    {
                        ThinkingLevel = "MINIMAL",
                        IncludeThoughts = false
                    },
                },
                cancellationToken);

            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "API key validation failed.");
            return (false, ex);
        }
    }
}