using Microsoft.AspNetCore.Mvc;
using XCan.Core.Interfaces;

namespace XCan.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MainController : ControllerBase
    {
        private readonly ILogger<MainController> _logger;
        private readonly IOcrService _ocrService;
        private readonly IGenerativeAiService _generativeAiService;

        public MainController(ILogger<MainController> logger, IOcrService ocrService, IGenerativeAiService generativeAiService)
        {
            _logger = logger;
            _ocrService = ocrService;
            _generativeAiService = generativeAiService;
        }

        /// <response code="200">"Valid Access Key"</response>
        /// <response code="401">Invalid Access Key</response>
        [HttpGet("ValidateApiKey")]
        public async Task<ActionResult<string>> Validate()
        {
            var apiValidationResult = await _generativeAiService.ValidateApiKeyAsync(string.Empty);

            return apiValidationResult.Success
                ? Ok("Valid Gemini API Key")
                : Unauthorized(apiValidationResult.Error?.Message);
        }

        [HttpPost("ExtractTextFromImage")]
        public async Task<ActionResult<string>> ExtractTextFromImage(IFormFile image, CancellationToken cancellationToken = default)
        {
            if (image == null || image.Length == 0)
                return BadRequest("No image file provided.");

            try
            {
                using var memoryStream = new MemoryStream();
                await image.CopyToAsync(memoryStream, cancellationToken);
                var result = await _ocrService.RecognizeTextAsync(memoryStream.ToArray(), cancellationToken);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
