using Microsoft.AspNetCore.Mvc;
using System.Text;
using XCan.Api.DTO;
using XCan.GenAI;
using static System.Net.Mime.MediaTypeNames;

namespace XCan.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MainController(ILogger<MainController> logger) : ControllerBase
    {
        private readonly ILogger<MainController> _logger = logger;

        /// <response code="200">"Valid Access Key"</response>
        /// <response code="400">Gemini API Key Not Found</response>
        /// <response code="401">Invalid Access Key</response>
        [HttpGet("ValidateApiKey")]
        public async Task<ActionResult<string>> Validate(string apiKey)
        {
            if (string.IsNullOrEmpty(apiKey))
            {
                return BadRequest("Gemini API Key Not Found");
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
                return BadRequest("Gemini API Key Not Found");
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
                var instruction = @"You are an AI designed especially to extract the text from image. Ensure that the output is **as accurate as possible**, and maintaining the structure without adding or removing any information. Try you best to preserve the **format** of the original text format (using Markdown syntax if needed), including paragraph breaks and punctuation, tables, programming code, etc. If you cannot find any text in the image, response with the 'Text Not Found'. ";
                var prompt = "This is the image for you to extract text.";
                var result = await Generator.ContentFromImage(apiKey, instruction.Trim(), prompt, image, false, 10);
                return Ok(result.Trim());
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("TranslateTextToVietnamese")]
        public async Task<ActionResult<string>> TranslateTextToVietnamese([FromBody] RequestTranslationDTO content, string apiKey)
        {
            if (string.IsNullOrEmpty(apiKey))
            {
                return BadRequest("Gemini API Key Not Found");
            }

            if (string.IsNullOrEmpty(content.ExtractedContent))
            {
                return BadRequest("Content to Translate Not Found");
            }

            if (string.IsNullOrEmpty(content.Base64Img))
            {
                return BadRequest("Image Not Found");
            }

            try
            {
                var instruction = "You are a translator with over 30 years of experience from any languages to Vietnamese. I will provide you with the image and the text that I extracted from the image (may not be accurate). Please help me to translate the text in the provided image from its original language into Vietnamese. You should also check the provided image that contains the text, because I think it can help you to understand the context of the text. Ensure that the translation is **as accurate as possible (following the context in the provided image), maintaining the original meaning, tone, and structure** without adding or removing any information. Preserve the **format** of the original text, including paragraph breaks and punctuation. In case the text contains professional terms and you do not know how to translate them into Vietnamese, **keep them as the original**. **Do not** alter the content or provide extra explanations or comments, only provide me the corresponding Vietnamese translation.";

                var image = content.Base64Img
                    .Replace("data:image/png;base64,", string.Empty)
                    .Replace("data:image/jpeg;base64,", string.Empty)
                    .Replace("data:image/heic;base64,", string.Empty)
                    .Replace("data:image/heif;base64,", string.Empty)
                    .Replace("data:image/webp;base64,", string.Empty)
                    .Trim();

                var result = await Generator.ContentFromImage(apiKey, instruction.Trim(), content.ExtractedContent.Trim(), image, false, 50);
                return Ok(result.Trim());
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
