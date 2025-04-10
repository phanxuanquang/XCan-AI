
#### **1. Flow: First-Time User Onboarding & API Key Validation**

This flow covers the user's initial interaction, focusing on API key input and validation.

**Detailed Steps:**

1.  **[Start]** User navigates to the XCan web application URL.
2.  **[System Check]** The application checks for a valid, active API key session/token (e.g., in `sessionStorage` or via a backend check if implementing user accounts later).
3.  **[Decision]** Is a valid API key session active?
    *   **[YES]** → Proceed directly to **Flow 2, Step 1 (Main Application Page)**.
    *   **[NO]** → **Step 4: Display API Key Input Page.**
4.  **[UI Display - API Key Input Page]** The interface presents:
    *   Clear Title: "Welcome to XCan"
    *   Instruction: "Please enter your Google AI Gemini API Key to proceed."
    *   Input Field: Text input specifically for the API Key. `type="password"` recommended initially.
    *   Helper Link: "Get the API Key from Google AI Studio".
    *   Primary Button: "Start".
    *   Client-side validation might check for basic format of a valid Gemini API Key format (e.g., non-empty) when user is typing the API Key. 
5.  **[User Action]** User enters their Gemini API Key into the input field and clicks "Start".
6.  **[System Action - Validation]**
    *   Display loading state (e.g., button disabled, spinner shown).
    *   *(Edge Case Handling)*: Perform basic client-side format check. If fails (e.g., empty), show an inline error message near the input field and prevent API call.
    *   **[API Request]** Frontend validates the entered API Key by calling the Gemini API.
7.  **[Decision - Validation Result]** Was the API Key validated successfully by the Gemini API response?
    *   **[YES]**
        *   Frontend stores the validated Gemini API Key into the local storage with a key "xcan_api_key".
        *   Clear loading state.
        *   Navigate the user to the Main Application Page.
        *   → Proceed to **Flow 2, Step 1**.
    *   **[NO]**
        *   Clear loading state.
        *   **[Error Handling]** Display a specific, user-friendly error message on the API Key Input page based on the Gemini API response:
            *   *Invalid Key:* "The API Key provided is invalid. Please check and try again."
            *   *Quota Exceeded/Billing Issue:* "There might be an issue with your Google AI account (e.g., quota limit, billing). Please check your account settings."
            *   *Network/Server Error:* "Could not validate the API Key due to a network issue. Please try again later."
            *   *Generic Error:* "An unexpected error occurred during validation. Please try again."
        *   Keep the user on the API Key Input Page, allowing them to correct the key and retry.
        *   → Return to **Step 5**.
8.  **[End/Transition]** User is either on the Main Application Page (success) or remains on the API Key Input Page to correct errors.

**Gherkin Scenarios (API Key Validation):**

```gherkin
Feature: API Key Validation

  Scenario: Successful API Key Validation
    Given the user is on the API Key Input Page
    And the user has a valid Gemini API Key
    When the user enters the valid API Key into the input field
    And the user clicks the "Start" button
    Then the system should display a loading indicator
    And the system should send the key to the backend for validation
    And the system should receive a success response from the backend
    And the user should be redirected to the Main Application Page

  Scenario: Invalid API Key Submission
    Given the user is on the API Key Input Page
    And the user has an invalid Gemini API Key
    When the user enters the invalid API Key into the input field
    And the user clicks the "Start" button
    Then the system should display a loading indicator
    And the system should send the key to the backend for validation
    And the system should receive an 'invalid key' error response from the backend
    And the system should display an error message "The API Key provided is invalid. Please check and try again."
    And the user should remain on the API Key Input Page

  Scenario: Empty API Key Submission (Client-side)
    Given the user is on the API Key Input Page
    When the user clicks the "Start" button without entering an API Key
    Then the system should display an inline error message like "API Key cannot be empty."
    And no API call should be made to the backend
```

---

#### **2. Flow: Core Feature - Image Input to HTML/Tailwind Output**

This flow details the main functionality after successful authentication.

**Detailed Steps:**

1.  **[Start]** User is on the Main Application Page. The page displays:
    *   An input area (e.g., Dropzone) for image upload/drag/paste. Clear instructions provided.
    *   An output area for the rendered HTML preview (initially empty or showing a placeholder/instruction).
    *   An output area for the HTML/Tailwind code (initially empty or showing a placeholder).
    *   Control buttons ("Copy Code", "Try Again") are likely disabled initially.
2.  **[User Action - Image Input]** User provides an image via one method:
    *   **Upload:** Clicks the input area, selects a file using the OS file picker.
    *   **Drag & Drop:** Drags an image file from their desktop and drops it onto the designated dropzone area. (UI should provide visual feedback during drag-over).
    *   **Paste:** Copies an image to the clipboard (e.g., from a design tool or screenshot), focuses the page (or a specific area), and presses Ctrl+V/Cmd+V.
3.  **[System Action - Input Processing & Validation]**
    *   *(Edge Case Handling - Paste)*: Check if pasted content is actually an image. If not, ignore or show a subtle notification "Pasted content is not a valid image".
    *   *(Edge Case Handling - File Type/Size)*: Validate the file type (allow common types like PNG, JPG, WEBP, GIF?) and size (implement a reasonable limit, e.g., 10MB). If invalid, display an immediate error message (e.g., "Unsupported file type. Please use PNG, JPG, or WEBP.", "Image size exceeds the 10MB limit.") and abort the process. → Return to **Step 1**.
    *   Display a thumbnail preview of the uploaded/pasted image in the input area.
    *   Clear any previous results from the output areas.
    *   Display a prominent loading state in both the Preview and Code Output areas (e.g., skeleton loader, message like "XCan is analyzing your image and generating code...").
    *   Disable input methods temporarily to prevent concurrent requests.
    *   **[Network Request]** Frontend sends the validated image data (base64 encoded) to the Gemini API.
4.  **[System Action ]**
    *   Frontend call a util function to constructs the appropriate prompt for the Gemini API, including the image and the instruction to generate HTML with Tailwind CSS.
    *   **[API Call]** Frontend calls the Gemini API.
    *   *(Edge Case Handling - API Timeout)*: Implement a timeout for the Gemini API call.
    *   *(Edge Case Handling - API Errors)*: Handle potential errors from Gemini (e.g., rate limits, content safety triggers, internal errors, inability to process image, empty response).
    *   **[Gemini Response]** Frontend receives the generated HTML/Tailwind code (or an error) from Gemini.
    *   Frontend performs minimal validation/sanitization on the received code if necessary.
    *   **[Network Response]** Frontend sends the generated code (or a structured error message) back to the Frontend.
5.  **[Decision - Code Generation Result]** Did the util function return successful code generation?
    *   **[YES]** → **Step 6: Display Results.**
    *   **[NO]** → **Step 7: Handle Generation Error.**
6.  **[UI Display - Success]**
    *   Remove loading states from output areas.
    *   **Render Preview:** Safely render the received HTML/Tailwind code within the Preview area (e.g., using a sandboxed `iframe` to prevent script execution and style conflicts).
    *   **Display Code:** Display the raw HTML/Tailwind source code in the Code Viewer area with syntax highlighting.
    *   Enable the "Copy Code" and "Try Again"/"Clear" buttons.
    *   Re-enable image input methods.
    *   → Proceed to **Step 8 (User Interaction with Results)**.
7.  **[UI Display - Error Handling]**
    *   Remove loading states.
    *   Display a clear error message in the output area or as a notification, based on the error received from the util function:
        *   *Gemini Content Filter:* "The image could not be processed due to content restrictions."
        *   *Gemini Processing Error:* "XCan couldn't generate code for this image. It might be too complex or unrecognizable. Try a different image."
        *   *Timeout/Network Error:* "The code generation timed out or failed due to a network issue. Please try again."
        *   *Generic Error:* "An unexpected error occurred while generating the code. Please try again."
    *   Keep the image thumbnail visible.
    *   Ensure the "Try Again" button is enabled. The "Copy Code" button remains disabled.
    *   Re-enable image input methods.
    *   → Proceed to **Step 8 (User can choose to 'Try Again')**.
8.  **[User Action - Interact with Results]** User can now:
    *   **Copy Code:** Click the "Copy Code" button.
        *   **[System Action]** Copy the code from the Code Viewer to the clipboard using the Clipboard API.
        *   **[UI Feedback]** Show a temporary confirmation message (e.g., "Code copied!").
    *   **Try Again:** Click the "Try Again" button.
        *   **[System Action]** Reset the interface: clear the image thumbnail, clear the Preview area, clear the Code Viewer area, disable "Copy Code".
        *   → Return to **Step 1 (Ready for new input)**.
    *   **Input New Image:** Perform actions from **Step 2** again.
9.  **[End]** The user has either copied the code, cleared the interface to start over, or encountered an error and decided on the next step.

**Gherkin Scenarios (Core Feature):**

```gherkin
Feature: Image to HTML/Tailwind Code Generation

  Scenario: Successful Code Generation via Upload
    Given the user is on the Main Application Page and authenticated
    When the user uploads a valid JPG image file less than 10MB
    Then the system should display the image thumbnail
    And the system should display loading indicators in the Preview and Code areas
    And the system should send the image data to the Gemini API
    And the system should receive generated HTML/Tailwind code from the Gemini API
    And the Preview area should render the HTML structure based on the received code
    And the Code Viewer area should display the raw HTML/Tailwind code with syntax highlighting
    And the "Copy Code" and "Try Again" buttons should be enabled

  Scenario: Successful Code Generation via Paste
    Given the user is on the Main Application Page and authenticated
    And the user has copied a valid image to the clipboard
    When the user pastes the image onto the page (Ctrl+V/Cmd+V)
    Then the system should display the image thumbnail
    And the system should display loading indicators
    And the system should send the image data to the Gemini API
    And the system should receive generated code
    And the Preview and Code areas should display the results
    And relevant buttons should be enabled

  Scenario: Attempt to Upload Unsupported File Type
    Given the user is on the Main Application Page and authenticated
    When the user attempts to upload a ".txt" file
    Then the system should display an error message like "Unsupported file type. Please use PNG, JPG, or WEBP."
    And no loading indicators should appear
    And no API call should be made

  Scenario: Gemini API Returns an Error (e.g., complexity)
    Given the user is on the Main Application Page and authenticated
    When the user uploads a very complex or abstract image
    And the system sends the image data to the Gemini API   
    And the Gemini API fails to process the image and returns an error
    Then the system should receive an error status from the Gemini API
    And the loading indicators should disappear
    And the system should display an error message like "XCan couldn't generate code for this image. It might be too complex..."
    And the "Copy Code" button should remain disabled
    And the "Try Again" button should be enabled

  Scenario: User Copies Generated Code
    Given the user is on the Main Application Page
    And the system has successfully generated and displayed code and preview
    When the user clicks the "Copy Code" button
    Then the generated HTML/Tailwind code should be copied to the user's clipboard
    And the system should display a temporary confirmation message like "Code copied!"

  Scenario: User Clicks Try Again After Success
    Given the user is on the Main Application Page
    And the system has successfully generated and displayed code and preview
    When the user clicks the "Try Again" button
    Then the image thumbnail should be cleared
    And the Preview area should be cleared or show the initial placeholder
    And the Code Viewer area should be cleared or show the initial placeholder
    And the "Copy Code" button should be disabled
```