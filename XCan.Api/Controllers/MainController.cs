using Microsoft.AspNetCore.Mvc;
using XCan.Api.DTO;
using XCan.GenAI;

namespace XCan.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MainController(ILogger<MainController> logger) : ControllerBase
    {
        private readonly ILogger<MainController> _logger = logger;

        /// <response code="200">"Valid Access Key"</response>
        /// <response code="401">Invalid Access Key</response>
        [HttpGet("ValidateApiKey")]
        public async Task<ActionResult<string>> Validate(string apiKey)
        {
            var isValidApiKey = await Generator.IsValidApiKey(apiKey);

            return isValidApiKey
                ? Ok("Valid Gemini API Key")
                : Unauthorized("Invalid Gemini API Key");
        }

        [HttpPost("ExtractTextFromImage")]
        public async Task<ActionResult<string>> ExtractTextFromImage([FromBody] string image, string apiKey)
        {
            if (!Generator.CanBeGeminiApiKey(apiKey))
            {
                return BadRequest("Invalid Gemini API Key");
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
You are a superior AI designed specially for extracting text from the image that I provide. Your mission is to extract all text and formatting from the provided image with the highest fidelity possible, using Markdown for core formatting and supplementing with HTML and CSS for enhanced styling. You have to ensure the output closely resembles the original layout, maintaining the details and structures as much as possible. Follow these comprehensive guidelines to handle various formatting exceptions effectively:

### 1. **Headings and Text Hierarchy**
- **Detect and format headings**: Identify title, subtitle, and section headers, using appropriate Markdown syntax (`#`, `##`, etc.) and HTML tags (`<h1>`, `<h2>`, etc.). If additional styling is required, include inline CSS (e.g., `<h1 style=""font-size:2em; color:#000;"">Title</h1>`).
- **Fallback for ambiguous headers**: Label ambiguous headers as “Potential Header” and indicate their level for verification.

### 2. **Paragraphs and Text Blocks**
- **Spacing and Alignment**: Reproduce each paragraph's spacing and line breaks using Markdown (`\n\n`) or HTML (`<p>`), with `<br>` for single line breaks. Use CSS for additional margin and padding (e.g., `<p style=""margin: 10px 0;"">Paragraph text</p>`).
- **Text Alignment**: For centered or right-aligned text, use CSS (e.g., `<div style=""text-align:center;"">Text</div>`).

### 3. **Lists and Nested Lists**
- **Structure lists accurately**: Use Markdown (`-` or `*` for unordered lists, `1.` for ordered lists). For nested lists, maintain indentation in Markdown or switch to HTML (`<ul>`, `<ol>`, `<li>`) for better control.
- **Custom List Styles**: If special symbols or styles are used, implement CSS (e.g., `<ul style=""list-style-type:square;"">`) to achieve the desired appearance.

### 4. **Tables**
- **Table Recognition**: Detect all tables and use Markdown tables for simple layouts. For complex tables, implement HTML (`<table>`, `<tr>`, `<td>`) and utilize CSS for styling (e.g., `<table style=""border-collapse:collapse; width:100%;"">`).
- **Handling Nested Tables**: For nested tables, specify attributes like `colspan` and `rowspan` to maintain structure, applying CSS for cell padding and borders.

### 5. **Code Blocks and Inline Code**
- **Identify code snippets**: Use backticks (\`) for inline code and triple backticks (\`\`\`) for code blocks. Specify the language if syntax highlighting is needed (e.g., ` ```python `). Use CSS to style code blocks (`<pre style=""background-color:#f4f4f4; padding:1rem;"">`).
- **Complex Code Handling**: For mixed languages or unique formats, wrap in `<pre><code>` to prevent formatting issues.

### 6. **Text Emphasis and Special Formatting**
- **Text styling**: Use Markdown (`**bold**`, `*italic*`, `_underline_`) for emphasis. For custom colors or multiple styles, apply HTML and CSS (e.g., `<span style=""color:red; font-weight:bold;"">text</span>`).
- **Fallback for Unsupported Styles**: For formats like “shadowed text” or gradients, use CSS for placeholder effects (e.g., `<span style=""text-shadow: 2px 2px 5px grey;"">text</span>`).

### 7. **Hyperlinks and References**
- **Detect URLs or hyperlinks**: Format them using `[text](URL)` in Markdown or `<a href=""URL"" style=""color:blue; text-decoration:none;"">text</a>` in HTML, including any titles or descriptions found in the original image.

### 8. **Special Characters, Unicode, and Symbols**
- **Ensure accurate symbol reproduction**: Use HTML entities for special symbols (e.g., `&copy;` for ©). If unsupported in Markdown, provide a detailed description.
- **Fallback for Complex Symbols**: For scientific symbols, include the closest Unicode equivalent or a description to retain clarity.

### 9. **Footnotes, Superscripts, and Subscripts**
- **Identify footnotes**: Use Markdown for footnotes as `[1]` with corresponding explanations at the end, or use HTML (`<sup>` for superscripts and `<sub>` for subscripts) for in-line annotations.
- **Custom Notation**: Maintain consistency with the image format for various styles (e.g., asterisks for footnotes).

### 10. **Formulas and Equations**
- **Mathematical notation**: Use LaTeX (`$formula$`) if supported, or plain text with Markdown for simple equations. For complex formulas, use HTML with inline CSS for clear representation (e.g., `<span style=""font-size:1.2em;"">E=mc^2</span>`).
- **Fallback for Complex Formulas**: Add an image placeholder or description for intricate formulas.

### 11. **Images, Icons, and Visual Elements**
- **Insert all images**: Use Markdown `![alt text](URL)` or HTML `<img src=""URL"" alt=""description"" style=""max-width:100%; height:auto;"">` for images. If an image is not extractable, provide a detailed text description.
- **Alternative Text**: For icons, add short descriptions (`<span style=""font-style:italic;"">Icon: gear</span>`).

### 12. **Text Boxes and Callouts**
- **Text box replication**: Use `<blockquote style=""border-left: 4px solid #ccc; padding: 10px; margin: 20px 0;"">` for callouts or `<div style=""border:1px solid #ccc; background-color:#f9f9f9; padding:10px;"">` for boxed text.
- **Background Colors for Callouts**: Specify CSS for highlighted boxes (e.g., `<div style=""background-color:#ffffcc; padding:10px;"">Important Note</div>`).

### 13. **Multilingual Text Handling**
- **Identify and format multilingual text**: Retain original language styling and formatting. Use language-specific fonts or CSS if applicable (e.g., `<span lang=""fr"" style=""font-family:'Arial';"">Bonjour</span>`).
- **Fallback for Unrecognized Languages**: If text is unrecognized, provide a note for context and possible translations.

### 14. **Emojis and Symbols**
- **Detect and represent emojis**: Use Unicode representations or image alternatives if needed. If not supported, describe their intended meaning (e.g., `<span style=""font-size:1.5em;"">😊 Happy Face</span>`).
- **Fallback for Missing Emojis**: Provide text descriptions for emojis to maintain context.

**Output Requirements**:
- Default to Markdown for core formatting, using HTML and CSS for complex elements.
- Ensure all extracted text and elements closely match the original layout, maintaining details and structures.
- Provide clear notes for any elements not replicable in Markdown, using HTML and CSS to enhance visibility and formatting.
- Response with the 'Text Not Found' if you can't find any text in the image that I provide.";
                var prompt = "This is the image for you to extract text.";
                var result = await Generator.ContentFromImage(apiKey, instruction, prompt, image, false, 20);
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
            if (!Generator.CanBeGeminiApiKey(apiKey))
            {
                return BadRequest("Invalid Gemini API Key");
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
                var instruction = "You are a translator with over 30 years of experience from any languages into **Vietnamese**. I will provide you with the image and the text that I extracted from the image. Please help me to translate the text in the provided image from its original language into Vietnamese. You should also check the provided image that contains the text, because I think it can help you to understand the context of the text. Ensure that the translation is **as accurate as possible (following the context in the provided image), maintaining the original meaning, tone, and structure** without adding or removing any information. Preserve the **format** of the original text, including paragraph breaks and punctuation. In case the text contains professional terms and you do not know how to translate them into Vietnamese, **keep them as the original**. **Do not** alter the content or provide extra explanations or comments, only provide me the corresponding Vietnamese translation.";

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
