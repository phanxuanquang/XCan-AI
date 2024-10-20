using Microsoft.AspNetCore.Mvc;
using XCan.GenAI;

namespace XCan.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MainController(ILogger<MainController> logger) : ControllerBase
    {
        private readonly ILogger<MainController> _logger = logger;

        /// <response code="200">"Valid Access Key"</response>
        /// <response code="400">Empty Access Key</response>
        /// <response code="401">Invalid Access Key</response>
        [HttpGet("ValidateApiKey")]
        public async Task<ActionResult<string>> Validate(string apiKey)
        {
            if (string.IsNullOrEmpty(apiKey))
            {
                return BadRequest("Empty Access Key");
            }

            try
            {
                await Generator.ContentFromText(apiKey, "You are my helpful assistant", "Say 'Hello World' to me!", false, 10);
                return Ok("Valid Access Key");
            }
            catch
            {
                return Unauthorized("Invalid Access Key");
            }
        }

        [HttpPost("ExtractTextFromImage")]
        public async Task<ActionResult<string>> ExtractTextFromImage([FromBody] string image, string apiKey)
        {
            if (string.IsNullOrEmpty(apiKey))
            {
                return BadRequest("Empty Access Key");
            }

            if (string.IsNullOrEmpty(image))
            {
                return BadRequest("Image Not Found");
            }

            image = image
                .Replace("data:image/png;base64,", string.Empty)
                .Replace("data:image/jpeg;base64,", string.Empty)
                .Replace("data:image/heic;base64,", string.Empty)
                .Replace("data:image/heif;base64,", string.Empty)
                .Replace("data:image/webp;base64,", string.Empty)
                .Trim();

            try
            {
                var prompt = "Extract the text from the given image!";
                return await Generator.ContentFromImage(apiKey, "You are an AI used to scan and extract the text from the input image, do not change the content or the format.", prompt, image, false, 10);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
