'use client';

import axios from 'axios';
// API endpoints
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Storage keys
export const API_KEY_STORAGE_KEY = 'xcan_api_key';
export const SYSTEM_INSTRUCTION_STORAGE_KEY = 'system_instruction';

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
                text: 'Simple API key validation test. Please respond with "valid".',
              },
            ],
          },
        ],
      }
    );

    return response.status === 200;
  } catch (error) {
    console.error('API key validation error:', error);
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
    let systemInstruction = localStorage.getItem(SYSTEM_INSTRUCTION_STORAGE_KEY);
    
    // If not in local storage, fetch from GitHub and save it
    if (!systemInstruction) {
      const systemInstructionResponse = await fetch('https://raw.githubusercontent.com/phanxuanquang/XCan-AI/refs/heads/master/xcan/lib/services/System%20Instruction.md');
      systemInstruction = await systemInstructionResponse.text();
      
      // Save to local storage for future use
      localStorage.setItem(SYSTEM_INSTRUCTION_STORAGE_KEY, systemInstruction);
    }

    const response = await axios.post(
      `${GEMINI_API_BASE_URL}/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        systemInstruction: systemInstruction,
        contents: [
          {
            parts: [
              { 
                text: prompt 
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64.split(',')[1] || imageBase64,
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
    
    let codeOutput = '';
    
    if (htmlMatch) {
      codeOutput = htmlMatch[0];
    } else if (codeBlockMatch) {
      codeOutput = codeBlockMatch[1].trim();
    } else {
      codeOutput = generatedText;
    }

    return { success: true, data: codeOutput };
  } catch (error: unknown) {
    console.error('HTML generation error:', error);
    
    let errorMessage = 'An unexpected error occurred while generating the code.';
    
    if (axios.isAxiosError(error)) {
      // Handle specific API error responses
      const statusCode = error.response?.status;
      
      if (statusCode !== undefined) {
        if (statusCode === 400) {
          errorMessage = 'The image could not be processed. It might be too complex or unrecognizable.';
        } else if (statusCode === 401) {
          errorMessage = 'Invalid API key or authorization issue.';
        } else if (statusCode === 403) {
          errorMessage = 'The image could not be processed due to content restrictions.';
        } else if (statusCode === 429) {
          errorMessage = 'API quota exceeded. Please check your Google AI account settings.';
        } else if (statusCode >= 500) {
          errorMessage = 'Google AI service is currently unavailable. Please try again later.';
        }
      } else if (!error.response) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
    } else if (error instanceof Error) {
      errorMessage = `Error: ${error.message}`;
    }
    
    return { success: false, error: errorMessage };
  }
} 