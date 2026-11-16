# Browser setup

XCan uses the AI model built into the browser through the [Prompt API](https://webmachinelearning.github.io/prompt-api/) (`LanguageModel`). Only **Google Chrome** and **Microsoft Edge** on a desktop computer have it.

[← Back to README](../README.md)

## Requirements

| | Google Chrome | Microsoft Edge |
|---|---|---|
| Model | Gemini Nano | Phi-4-mini (Aion-1.0-Instruct with the prerelease flag) |
| Prompt API on the web | Chrome 148 or later | Developer preview in Canary/Dev 138.0.3309.2 or later, behind a flag |
| Image input | Supported | Not documented by Microsoft |
| Free disk space | At least 22 GB (model is removed below 10 GB) | At least 20 GB (model is removed below 10 GB) |
| Hardware | GPU with more than 4 GB VRAM, or 16 GB RAM and 4+ CPU cores | GPU with 5.5 GB VRAM or more (Phi-4-mini). Aion-1.0-Instruct also runs on CPU |
| OS | Windows 10/11, macOS 13+, Linux, ChromeOS (Chromebook Plus) | Windows 10/11, macOS 13.3 or later |
| Network | Unmetered connection for the first download | Unmetered connection for the first download |
| Diagnostics | `chrome://on-device-internals` | `edge://on-device-internals` |

> [!IMPORTANT]
> Desktop only. Phones are not supported by either browser's Prompt API. Other browsers (Firefox, Safari, Brave, Opera and other Chromium browsers) see "Browser not supported".

Official docs:

- [Chrome: Prompt API](https://developer.chrome.com/docs/ai/prompt-api)
- [Chrome: built-in AI, get started (hardware requirements)](https://developer.chrome.com/docs/ai/get-started)
- [Chrome: inform users of model download](https://developer.chrome.com/docs/ai/inform-users-of-model-download)
- [Edge: Prompt API](https://learn.microsoft.com/microsoft-edge/web-platform/prompt-api)

## Set up Chrome

- [ ] Use Chrome 148 or later on a desktop computer.
- [ ] Check free disk space and hardware against the table above.
- [ ] Open XCan and click **Download model** if asked.

If the model stays unavailable, open `chrome://on-device-internals` and check the **Broker State** tab for errors.

## Set up Edge

1. Install Edge Canary or Dev, version 138.0.3309.2 or later.
2. Open `edge://flags/#edge-llm-prompt-api-for-default`.
3. Set **Prompt API for on-device language model** to **Enabled**.
4. Restart Edge and open XCan.

<details>
<summary>Device performance class is Medium or Low?</summary>

The default model (Phi-4-mini) needs a **Device performance class** of High or above in `edge://on-device-internals`. On Medium or Low, Edge 150.0.4070 or later can use the smaller prerelease **Aion-1.0-Instruct** model, which also runs without a GPU:

1. Open `edge://flags` and search for **Enable prerelease on-device language model**.
2. Set it to **Enabled** and restart Edge.
3. In `edge://on-device-internals` → **Model Status**, check that **Model Name** is **Aion-1.0-Instruct**.

</details>

> [!NOTE]
> Edge's docs describe text prompts only. XCan asks for image input, so whether it works depends on the Edge build.

## Translation

The translate menu uses two more built-in APIs: [Translator](https://developer.chrome.com/docs/ai/translator-api) and [Language Detector](https://developer.chrome.com/docs/ai/language-detection). Chrome's docs list them from Chrome 138 on desktop; they don't work on mobile. Edge documents the [Translator API](https://learn.microsoft.com/microsoft-edge/web-platform/translator-api) too. If a browser lacks either API, the translate icon is hidden. Language packs download on first use of each pair.

## What XCan shows when something is missing

On load XCan calls `LanguageModel.availability()` with the same options it uses to prompt (text + image in, English text out):

| Result | What you see |
|---|---|
| No `LanguageModel` | Dialog: update Chrome / turn on the Edge flag |
| `available` | "Preparing XCan" while the model loads, then the app |
| `downloadable` / `downloading` | Dialog with the requirements and a **Download model** button, then a progress bar |
| `unavailable` | Dialog with the requirements and a **Checked on this device** list |

The Prompt API only answers `unavailable`, never why. The **Checked on this device** list narrows it down with what a web page can test:

- Desktop or laptop (`navigator.userAgentData.mobile`).
- Whether the model runs at all: a second `availability()` call without image input.
- Whether image input is the missing piece: text-only works but text + image does not.
- Chrome only: CPU cores (`navigator.hardwareConcurrency`) and RAM (`navigator.deviceMemory`, which may be capped, so 8 GB shows as "cannot tell").

Free disk space, VRAM and network type cannot be read by a web page. Check them in the browser's `on-device-internals` page.
