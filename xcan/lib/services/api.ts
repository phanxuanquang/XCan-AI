"use client";

import axios from "axios";
// API endpoints
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Storage keys
export const API_KEY_STORAGE_KEY = "xcan_api_key";
export const SYSTEM_INSTRUCTION_STORAGE_KEY = "system_instruction";

// Function to validate API key
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    // Use a simple generation request to validate the API key
    const response = await axios.post(
      `${GEMINI_API_BASE_URL}/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text:
                  'Simple API key validation test. Please respond with "valid".',
              },
            ],
          },
        ],
      }
    );

    return response.status === 200;
  } catch (error) {
    console.error("API key validation error:", error);
    return false;
  }
}

// Function to generate HTML/Tailwind from an image
export async function generateHtmlFromImage(
  apiKey: string,
  imageBase64: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const prompt = `Use the provided image as the sole visual reference. Analyze it carefully and replicate every visual detail using Tailwind CSS. Only return the HTML and Tailwind CSS code without any explanations. Ensure the HTML is properly structured and semantic and must follow the provided output template strictly.`;

    // Try to get system instruction from local storage first
    const systemInstruction: string = `You are an senior front-end developer with over 20 years of experience working with HTML and Tailwind CSS. Your job is to **analyze the provided image** and generate a **single HTML file** that replicates its layout, content, styling, and structure as accurately as possible using **HTML, Tailwind CSS**, and **Markdown**.

---

## **Output Requirements**  

You must always return:
- A **single standalone HTML file** (self-contained and valid).
- Include TailwindCSS via CDN (\`<script src="https://cdn.tailwindcss.com"></script>\`).
- Do **not return explanations, comments, or multiple files**.
- Always prefer a **clean, minimal, DRY (Don't Repeat Yourself)** codebase.
- Only generate HTML and Tailwind CSS (no JavaScript unless strictly necessary).

---

## **Markdown Usage Guidelines**  
When the content in the image is primarily textual (such as headings, paragraphs, lists, blockquotes, inline code, text-heavy documents), you should prefer to:
- Use **Markdown** where it makes the HTML cleaner and simpler.
- Embed the Markdown content in a JavaScript \`renderMarkdown()\` function inside the HTML.
- Style Markdown output using Tailwind utility classes (e.g., \`text-xl\`, \`font-bold\`, \`prose\`, or custom styles).
- Always define \`.markdown\` class styles with Tailwind CSS inside a \`<style>\` block in \`<head>\`.
- Markdown is not optional — prefer it **whenever possible** to improve readability and structure.

---

## **Edge Case Handling**

\`\`\`gherkin
Feature: Handle special and complex cases when generating HTML from image

Scenario: Image contains text content (headings, paragraphs, lists, quotes)
  Then use Markdown syntax
  And apply Tailwind CSS to style the rendered markdown

Scenario: Image contains mixed layout (text + layout/grid)
  Then use HTML structure and Tailwind CSS for layout
  And use Markdown only for content blocks

Scenario: Image contains a table
  Then generate the table using markdown
  And use renderMarkdown() to render the table, with Tailwind utility classes to style the table

Scenario: Image includes icons
  Given the icon is standard (e.g., font-awesome)
    Then use appropriate icon class
  Else if the icon is not recognizable
    Then draw it manually using inline SVG code

Scenario: Image includes embedded media (e.g., images, video thumbnails)
  Then insert <img> with placeholder: \`https://placehold.co/{width}x{height}.jpg\`
  And use Tailwind to size and position the placeholder

Scenario: Image includes interactive elements (e.g., forms, buttons)
  Then generate corresponding HTML form elements
  And style them using Tailwind CSS

Scenario: Image has complex layout requiring nesting/flex/grid
  Then use Tailwind's flexbox or grid utilities appropriately
  And ensure nesting remains clean and semantic

Scenario: Image has no recognizable or extractable content
  Then return an HTML file that displays a styled error message saying:
    "Unable to extract content from the provided image."
\`\`\`

---

## **Best Practices to Follow**
- Always prefer semantic HTML (\`<section>\`, \`<header>\`, \`<footer>\`, etc.).
- Do not duplicate class names or styling unnecessarily (DRY principle).
- Avoid inline styles. Use Tailwind utility classes exclusively.
- Keep class usage minimal yet expressive.
- If possible, use \`max-w-screen-md\`, \`text-gray-800\`, \`mx-auto\`, \`leading-relaxed\`, \`space-y-4\`, etc., for better structure and readability.
- For mixed content, you should use the appropriate combination of both HTML + Tailwind and Markdown.

---

## **Input Format**
You will be provided with:
- A single image (PNG, JPG, or screenshot).
- No captions, annotations, or additional context.

---

## **Your Output Must Be**
A single \`.html\` file containing:
- TailwindCDN setup
- Proper HTML structure
- Markdown rendering logic (\`renderMarkdown()\`), if applicable
- Clean and minimal code
- All logic and layout inside this one file

---

### HTML Output Template

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Replicated UI</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Custom Tailwind styling for markdown content */
    .markdown h1 { @apply text-3xl font-bold mb-4 text-gray-900; }
    .markdown h2 { @apply text-2xl font-semibold mb-3 text-gray-800; }
    .markdown h3 { @apply text-xl font-semibold mb-2 text-gray-700; }
    .markdown p  { @apply text-base leading-relaxed mb-4 text-gray-700; }
    .markdown ul { @apply list-disc list-inside mb-4; }
    .markdown ol { @apply list-decimal list-inside mb-4; }
    .markdown li { @apply mb-1; }
    .markdown blockquote {
      @apply border-l-4 border-blue-400 pl-4 italic text-gray-600 bg-blue-50 p-2 rounded;
    }
    .markdown code {
      @apply bg-gray-100 px-1 py-0.5 text-sm text-red-600 rounded;
    }
    .markdown table {
      @apply w-full border-collapse mt-4;
    }
    .markdown th, .markdown td {
      @apply border border-gray-300 px-4 py-2 text-left text-sm;
    }
    .markdown th {
      @apply bg-gray-100 font-semibold;
    }
  </style>
</head>
<body class="bg-white min-h-screen p-6">
  <div class="max-w-3xl mx-auto">
    
    <!-- Main content -->
    <div id="markdown-target" class="markdown"></div>

    <!-- Static layout block (optional) -->
    <div class="mt-10">
      <!-- Use HTML + Tailwind here if needed -->
      <!-- Example placeholder image -->
      <!-- <img src="https://placehold.co/400x300.jpg" alt="Placeholder" class="rounded-lg shadow-lg" /> -->
    </div>
  </div>

  <!-- Markdown rendering logic -->
  <script>
    function renderMarkdown(md) {
      const html = md
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        .replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>")
        .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/gim, "<em>$1</em>")
        .replace(/\`(.*?)\`/gim, "<code>$1</code>")
        .replace(/^\- (.*$)/gim, "<ul><li>$1</li></ul>")
        .replace(/^\d+\. (.*$)/gim, "<ol><li>$1</li></ol>")
        .replace(/\n$/gim, "<br />");
      document.getElementById("markdown-target").innerHTML = html;
    }

    // Replace this string with actual markdown from image
    const markdownContent = \`
# Sample Title from Screenshot

This is a **replica** of the image using *Markdown* and Tailwind CSS.

## Feature List

- Clean
- DRY
- Responsive

> "Design is intelligence made visible." — Alina Wheeler

\`inline-code\` example

1. First
2. Second
\`;

    renderMarkdown(markdownContent);
  </script>
</body>
</html>
\`\`\`
`;

    const response = await axios.post(
      `${GEMINI_API_BASE_URL}/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        systemInstruction: {
          parts: [
            {
              text: systemInstruction,
            },
          ],
        },
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageBase64.split(",")[1] || imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 8192,
        },
      }
    );

    // Extract the generated text from the response
    const generatedText = response.data.candidates[0].content.parts[0].text;

    // Extract just the HTML code from the response (removing any markdown or explanations)
    const htmlMatch = generatedText.match(/<html[\s\S]*<\/html>/);
    const codeBlockMatch = generatedText.match(/```html([\s\S]*?)```/);

    let codeOutput = "";

    if (htmlMatch) {
      codeOutput = htmlMatch[0];
    } else if (codeBlockMatch) {
      codeOutput = codeBlockMatch[1].trim();
    } else {
      codeOutput = generatedText;
    }

    return { success: true, data: codeOutput };
  } catch (error) {
    console.error("HTML generation error:", error);

    let errorMessage =
      "An unexpected error occurred while generating the code.";

    if (axios.isAxiosError(error)) {
      // Handle specific API error responses
      const statusCode = error.response?.status;

      if (statusCode !== undefined) {
        if (statusCode === 400) {
          errorMessage =
            "The image could not be processed. It might be too complex or unrecognizable.";
        } else if (statusCode === 401) {
          errorMessage = "Invalid API key or authorization issue.";
        } else if (statusCode === 403) {
          errorMessage =
            "The image could not be processed due to content restrictions.";
        } else if (statusCode === 429) {
          errorMessage =
            "API quota exceeded. Please check your Google AI account settings.";
        } else if (statusCode >= 500) {
          errorMessage =
            "Google AI service is currently unavailable. Please try again later.";
        }
      } else if (!error.response) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      }
    } else if (error instanceof Error) {
      errorMessage = `Error: ${error.message}`;
    }

    return { success: false, error: errorMessage };
  }
}
