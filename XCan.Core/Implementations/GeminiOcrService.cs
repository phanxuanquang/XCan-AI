using Google.GenAI;
using Google.GenAI.Types;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using XCan.Core.Constants;
using XCan.Core.Interfaces;
using XCan.Core.Options;

namespace XCan.Core.Implementations;

public class GeminiOcrService : IOcrService
{
    private readonly ILogger<GeminiOcrService> _logger;
    private readonly Client _client;
    private readonly string _model;

    public GeminiOcrService(Client client, IOptions<GeminiOptions> options, ILogger<GeminiOcrService>? logger = null)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _client = client ?? throw new ArgumentNullException(nameof(client));
        _model = options?.Value.ModelName ?? throw new ArgumentNullException(nameof(options));
    }

    public async Task<string> RecognizeTextAsync(byte[] imageBytes, CancellationToken cancellationToken = default)
    {
        var contents = new List<Content>
        {
            new() {
                Role = "user",
                Parts =
                [
                    new Part
                    {
                        InlineData = new Blob
                        {
                            Data = imageBytes,
                            MimeType = "image/jpeg"
                        },
                    },
                    new Part { Text = "Please read the provided image and do your job according to the system instructions properly." },
                ]
            }
        };

        var result = await _client.Models.GenerateContentAsync(
            _model,
            contents,
            GenerativeConstants.GeminiGenerateContentConfig,
            cancellationToken);

        return result.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text ?? string.Empty;
    }
}