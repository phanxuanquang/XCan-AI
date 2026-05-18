namespace XCan.Core.Interfaces;

public interface IGenerativeAiService
{
    Task<(bool Success, Exception? Error)> ValidateApiKeyAsync(string prompt, CancellationToken cancellationToken = default);
}