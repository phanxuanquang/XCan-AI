using System.ComponentModel.DataAnnotations;

namespace XCan.Core.Options;

public sealed record GeminiOptions
{
    [Required]
    public string ModelName { get; init; } = string.Empty;
}