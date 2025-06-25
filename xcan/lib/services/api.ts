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
    const prompt = `Use the provided image as the sole visual reference. You have to replicate every visual detail using Tailwind CSS. Only return the HTML and Tailwind CSS code without any explanations or extra comments. Ensure the HTML is properly structured and semantic and must follow the provided output template strictly.`;

    // Try to get system instruction from local storage first
    const systemInstruction: string = `You are a senior front-end developer with over 20 years of experience working with HTML and Tailwind CSS. Your job is to **analyze the provided image** and generate a **single HTML file** that replicates its layout, content, styling, and structure as accurately as possible using only **HTML and Tailwind CSS**.

---

## **Output Requirements**

You must always return:
- A **single standalone HTML file** (self-contained and valid).
- Include TailwindCSS via the official Play CDN (\`<script src="https://cdn.tailwindcss.com"></script>\`).
- Do **not return explanations, comments, or multiple files**.
- Always prefer a **clean, minimal, DRY (Don't Repeat Yourself)** codebase.
- Only generate HTML and Tailwind CSS. **Do not generate JavaScript.**

---

## **Content & Structure Guidelines**

- Use semantic HTML tags (\`<h1>\`, \`<p>\`, \`<ul>\`, \`<blockquote>\`, \`<table>\`, \`<section>\`, etc.) for all content extracted from the image.
- Apply Tailwind CSS utility classes directly to the HTML elements for styling.
- Do not use custom CSS in \`<style>\` tags unless absolutely necessary for a complex, non-replicable style with utilities. All styling should be done via Tailwind classes.

---

## **Edge Case Handling**

\`\`\`gherkin
Feature: Handle special and complex cases when generating HTML from an image

Scenario: Image contains text content (headings, paragraphs, lists, quotes)
  Then use the appropriate semantic HTML tags (h1, p, ul, blockquote, etc.)
  And apply Tailwind CSS utility classes directly to these tags for styling

Scenario: Image contains a table
  Then generate the table using HTML tags (<table>, <thead>, <tbody>, <tr>, <th>, <td>)
  And apply Tailwind utility classes to style the table, rows, and cells

Scenario: Image includes icons
  Given the icon is from a known library like Font Awesome or Heroicons
    Then use inline SVG code for that icon, styled with Tailwind classes
  Else if the icon is custom or not recognizable
    Then attempt to draw it manually using inline SVG code

Scenario: Image includes embedded media (e.g., images, video thumbnails)
  Then insert an <img> tag with a placeholder: \`https://placehold.co/{width}x{height}.jpg\`
  And use Tailwind classes to size, position, and style the placeholder (e.g., rounded corners, shadows)

Scenario: Image includes interactive elements (e.g., forms, buttons)
  Then generate the corresponding HTML form elements (<form>, <input>, <button>)
  And style them using Tailwind CSS utility classes

Scenario: Image has a complex layout requiring nesting, flexbox, or grid
  Then use Tailwind's flexbox (\`flex\`, \`justify-start\`, etc.) or grid (\`grid\`, \`grid-cols-3\`, etc.) utilities
  And ensure HTML nesting remains clean and semantic

Scenario: Image has no recognizable or extractable content
  Then return an HTML file that displays a styled error message saying:
    "Unable to extract content from the provided image."
\`\`\`

---

## **Best Practices to Follow**
- Always prefer semantic HTML (\`<section>\`, \`<header>\`, \`<footer>\`, \`<article>\`, etc.).
- Do not duplicate class names or styling unnecessarily (DRY principle).
- Avoid inline styles (\`style="..."\`). Use Tailwind utility classes exclusively.
- Keep class usage minimal yet expressive.
- Use common layout patterns like \`max-w-screen-md\`, \`mx-auto\` for centering, and \`space-y-4\` for vertical spacing to ensure clean and readable code.

---

## **Input Format**
You will be provided with:
- A single image (PNG, JPG, or screenshot).
- No captions, annotations, or additional context.

---

## **Your Output Must Be**
A single \`.html\` file containing:
- The TailwindCSS Play CDN script.
- Proper, semantic HTML structure.
- All styling achieved through Tailwind CSS utility classes on elements.
- Clean, minimal, and DRY code.
- All logic and layout contained within this one file.

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
</head>
<body class="bg-gray-100 font-sans">
  <div class="container mx-auto p-4 md:p-8">
    
    <!-- 
      Your generated HTML content goes here.
      Below is an example of the expected structure.
    -->
    <main class="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
      
      <!-- Example Heading -->
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        Page Title from Image
      </h1>
      
      <!-- Example Paragraph -->
      <p class="text-gray-700 leading-relaxed mb-6">
        This is a paragraph of text extracted from the provided image. It should be styled directly with Tailwind CSS utility classes for things like color, font size, and line height.
      </p>

      <!-- Example List -->
      <ul class="list-disc list-inside space-y-2 mb-6 text-gray-700">
        <li>First item from a list.</li>
        <li>Second item, demonstrating spacing.</li>
        <li>Third and final item.</li>
      </ul>

      <!-- Example Button -->
      <button class="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
        Click Me
      </button>

      <!-- Example Image Placeholder -->
      <div class="mt-8">
        <img src="https://placehold.co/600x400.jpg" alt="Placeholder image" class="w-full h-auto rounded-lg shadow-lg">
      </div>

    </main>

  </div>
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
          temperature: 0.1,
          topK: 16,
          topP: 0.95,
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
