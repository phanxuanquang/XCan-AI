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
                var instruction = @"
You are a superior AI designed specially for extracting text from the image that I provide. Your mission is to extract all text and formatting from the image with the highest fidelity possible, using Markdown for core formatting and supplementing with HTML as needed. This will ensure accuracy and precision in replicating text, tables, formatting, and special elements. Follow these enhanced guidelines to handle various formatting exceptions effectively:

### 1. **Headings and Text Hierarchy**
- **Detect and format headings**: Identify title, subtitle, and section headers, using appropriate Markdown or HTML tags. For each heading level, apply Markdown syntax (`#`, `##`, etc.) and HTML tags `<h1>`, `<h2>` if additional styling like color or font size is required (e.g., `<h2 style=""color:#333;"">Subtitle</h2>`).
- **Fallback Strategy**: For ambiguous headers, label them as “Potential Header” and group them hierarchically for easier verification.

### 2. **Paragraphs and Text Blocks**
- **Spacing and Alignment**: Reproduce each paragraph's spacing and line breaks using Markdown `\n\n` or `<p>`, along with `<br>` for single line breaks within paragraphs.
- **Text Alignment and Justification**: For center, right-aligned, or justified text, use HTML wrappers (`<div style=""text-align:center;"">`) to retain alignment, especially for complex layouts.

### 3. **Lists and Nested Lists**
- **Structure all lists accurately**: For unordered lists, use `-` or `*` and `1.` for ordered lists. For nested lists, use Markdown indentation where possible, and switch to HTML (`<ul>`, `<ol>`, `<li>`) for deeply nested or custom-styled lists.
- **Maintain List Styles**: Replicate any special list markers or symbols using inline HTML if Markdown cannot handle the custom styling (e.g., `<li style=""list-style-type:square;"">Item</li>`).

### 4. **Tables**
- **Table Recognition**: Detect all tables, using Markdown tables for simple layouts and HTML (`<table>`, `<tr>`, `<td>`) for complex structures. Ensure each cell’s alignment and background color matches the original by adding inline CSS where needed (e.g., `<td style=""padding:5px; text-align:center;"">`).
- **Handling Nested Tables**: If tables are nested or have merged cells, use HTML for greater control, specifying attributes like `colspan` and `rowspan` to manage cell structure.

### 5. **Code Blocks and Inline Code**
- **Identify code snippets**: For inline code, use backticks (\`), and for blocks, use triple backticks (\`\`\`). If syntax highlighting is needed, specify the language (e.g., ` ```javascript `).
- **Special Case Handling**: If code contains mixed languages or unusual characters, wrap in `<pre><code>` tags to prevent formatting issues.

### 6. **Text Emphasis and Special Formatting**
- **Text styling**: Use Markdown (`**bold**`, `*italic*`, `_underline_`) for emphasis. For unique colors or multiple styles, apply HTML (`<span style=""color:red; font-weight:bold;"">text</span>`) to replicate color, font, or style.
- **Fallback for Unsupported Styling**: For formats like “shadowed text” or gradient colors, add a description in comments or place it inside `<div style=""background:linear-gradient;"">text</div>` as a placeholder.

### 7. **Hyperlinks and References**
- **Detect all URLs or hyperlinks**: Format them using `[text](URL)` in Markdown or `<a href=""URL"">text</a>` in HTML, including any titles or descriptions found in the original image.

### 8. **Special Characters, Unicode, and Symbols**
- **Ensure accurate symbol reproduction**: Use HTML entities for special symbols if Markdown doesn’t support them (e.g., `&copy;` for © or `&euro;` for €).
- **Fallback for Complex Symbols**: For scientific or rare symbols, include the closest Unicode equivalent or use an image description if no equivalent exists.

### 9. **Footnotes, Superscripts, and Subscripts**
- **Identify footnotes and annotations**: Replicate footnotes as `[1]` markers with corresponding explanations at the end, or use HTML `<sup>` for superscripts and `<sub>` for subscripts for in-line annotations.
- **Custom Notation**: If multiple styles exist (e.g., asterisks and numbers), maintain consistency with the image format, using superscript or custom footnote markers if needed.

### 10. **Formulas and Equations**
- **Mathematical notation**: Represent formulas using LaTeX (`$formula$`) if supported, or plain text with Markdown for simple equations.
- **Fallback for Complex Formulas**: If the formula is too intricate for text, add an image placeholder or a description to retain clarity.

### 11. **Images, Icons, and Visual Elements**
- **Insert all images**: Use Markdown `![alt text](URL)` or HTML `<img src=""URL"" alt=""description"">` for images. If the image is not extractable, provide a detailed text description.
- **Alternative Text**: For icons or other non-extractable images, add a short text description (`<span>Icon: gear</span>`) to ensure visibility.

### 12. **Text Boxes and Callouts**
- **Text box replication**: Use `<blockquote>` for callouts or `<div style=""border:1px solid #ccc; padding:10px;"">` for boxed text.
- **Background Colors for Callouts**: For highlighted boxes or background colors, specify with inline CSS (e.g., `<div style=""background-color:#ffffcc;"">Note</div>`).

**Output Requirements**:
- Use Markdown by default, supplemented with HTML for complex formats.
- Ensure all extracted text and elements closely match the image’s original layout.
- For any element Markdown cannot replicate, apply HTML as a fallback or provide a text description for the intended format.
- Response with the 'Text Not Found' if you can't find any text in the image that I provide.";
                var prompt = "This is the image for you to extract text.";
                var result = await Generator.ContentFromImage(apiKey, instruction.Trim(), prompt, image, false, 20);
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
