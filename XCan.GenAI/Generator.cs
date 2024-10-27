using Newtonsoft.Json;
using System.Text;

namespace XCan.GenAI
{
    public static class Generator
    {
        private const int ValidApiKeyLenght = 39;
        private const string ApiKeyPrefix = "AIzaSy";
        private static readonly HttpClient Client = new();

        public static async Task<string> ContentFromText(string apiKey, string? instruction, string query, bool useJson = true, double creativeLevel = 50)
        {
            var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={apiKey}";

            var request = new
            {
                systemInstruction = new
                {
                    parts = new[]
                    {
                        new
                        {
                            text = instruction,
                        }
                    }
                },
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new
                            {
                                text = query
                            }
                        }
                    }
                },
                safetySettings = new[]
                {
                    new
                    {
                        category = "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold = "BLOCK_NONE"
                    },
                    new
                    {
                        category = "HARM_CATEGORY_HARASSMENT",
                        threshold = "BLOCK_NONE"
                    },
                    new
                    {
                        category = "HARM_CATEGORY_HATE_SPEECH",
                        threshold = "BLOCK_NONE"
                    },
                    new
                    {
                        category = "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold = "BLOCK_NONE"
                    }
                },
                generationConfig = new
                {
                    temperature = creativeLevel / 100,
                    topP = 0.8,
                    topK = 10,
                    maxOutputTokens = 500000,
                    responseMimeType = useJson ? "application/json" : "text/plain"
                }
            };

            var body = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");
            var response = await Client.PostAsync(endpoint, body).ConfigureAwait(false);
            response.EnsureSuccessStatusCode();

            var responseData = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
            var responseDTO = JsonConvert.DeserializeObject<ModelResponseDTO.Response>(responseData);

            return responseDTO.Candidates[0].Content.Parts[0].Text;
        }

        public static async Task<string> ContentFromImage(string apiKey, string? instruction, string query, string base64Img, bool useJson = true, double creativeLevel = 50)
        {
            var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={apiKey}";

            var request = new
            {
                systemInstruction = new
                {
                    parts = new[]
                    {
                        new
                        {
                            text = instruction,
                        }
                    }
                },
                contents = new[]
                {
                    new
                    {
                        parts = new object[]
                        {
                            new
                            {
                                inline_data = new
                                {
                                    mime_type = "image/jpeg",
                                    data = base64Img
                                }
                            },
                            new
                            {
                                text = query
                            }
                        }
                    }
                },
                safetySettings = new[]
                {
                    new
                    {
                        category = "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold = "BLOCK_NONE"
                    },
                    new
                    {
                        category = "HARM_CATEGORY_HARASSMENT",
                        threshold = "BLOCK_NONE"
                    },
                    new
                    {
                        category = "HARM_CATEGORY_HATE_SPEECH",
                        threshold = "BLOCK_NONE"
                    },
                    new
                    {
                        category = "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold = "BLOCK_NONE"
                    }
                },
                generationConfig = new
                {
                    temperature = creativeLevel / 100,
                    topP = 0.8,
                    topK = 10,
                    maxOutputTokens = 500000,
                    responseMimeType = useJson ? "application/json" : "text/plain"
                }
            };

            var body = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");
            var response = await Client.PostAsync(endpoint, body).ConfigureAwait(false);
            response.EnsureSuccessStatusCode();

            var responseData = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
            var responseDTO = JsonConvert.DeserializeObject<ModelResponseDTO.Response>(responseData);

            return responseDTO.Candidates[0].Content.Parts[0].Text;
        }

        public static bool CanBeGeminiApiKey(string apiKey)
        {
            if (string.IsNullOrEmpty(apiKey))
            {
                return false;
            }

            apiKey = apiKey.Trim();

            return apiKey.Length == ValidApiKeyLenght && (apiKey.StartsWith(ApiKeyPrefix) || ApiKeyPrefix.StartsWith(apiKey));
        }

        public static async Task<bool> IsValidApiKey(string apiKey)
        {
            if (CanBeGeminiApiKey(apiKey))
            {
                try
                {
                    await ContentFromText(apiKey.Trim(), "You are my helpful AI assistant", "Print 'I am an AI'.", false, 10);
                    return true;
                }
                catch
                {
                    return false;
                }
            }

            return false;
        }
    }
}
