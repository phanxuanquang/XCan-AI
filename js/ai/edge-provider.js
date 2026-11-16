import { PromptApiProvider } from './prompt-api.js';

// Edge: Phi-4-mini (or prerelease Aion-1.0-Instruct), developer preview in Canary/Dev 138+.
// Edge docs describe text prompting only; image input may report 'unavailable'.
// Help text is Markdown (rendered by the app); facts come from the official docs in `docs`.
const REQUIREMENTS = `
- Windows 10 or 11, or macOS 13.3 or later.
- At least 20 GB free on the drive that holds your Edge profile. Edge removes the model if free space drops below 10 GB.
- A GPU with 5.5 GB of VRAM or more.
- An unlimited or unmetered connection for the first download.`;

const IMAGE_NOTE = "Edge's docs describe text prompts only, so image input may not work yet. **Google Chrome** supports images.";

export class EdgeAiProvider extends PromptApiProvider {
  get name() { return 'Microsoft Edge'; }

  get docs() {
    return [{ label: 'Prompt API (Microsoft Edge docs)', url: 'https://learn.microsoft.com/microsoft-edge/web-platform/prompt-api' }];
  }

  setupHelp(availability) {
    if (!this.isSupported()) {
      return {
        title: 'Turn on the Prompt API in Edge',
        md: `The Prompt API is a developer preview in **Edge Canary and Dev** (version 138.0.3309.2 or later).

1. Open \`edge://flags/#edge-llm-prompt-api-for-default\`.
2. Set *Prompt API for on-device language model* to **Enabled**.
3. Restart Edge.`,
      };
    }
    if (availability === 'downloadable' || availability === 'downloading') {
      return {
        title: 'Download the on-device model',
        md: `XCan reads your images with the AI model built into Edge. Edge downloads it once and shares it with every site that uses it. Your images never leave this device.

Before you start, check that this device has:
${REQUIREMENTS}

${IMAGE_NOTE}`,
      };
    }
    return {
      title: 'This device cannot run the model',
      md: `Edge reports that its on-device model cannot take image input here. ${IMAGE_NOTE}

The model also needs:
${REQUIREMENTS}

Check \`edge://on-device-internals\`: the default model (Phi-4-mini) needs a **Device performance class** of High or above.

On Medium or Low, Edge 150.0.4070 or later can use the smaller prerelease **Aion-1.0-Instruct** model, which also runs without a GPU:

1. Open \`edge://flags\` and search for *Enable prerelease on-device language model*.
2. Set it to **Enabled** and restart Edge.`,
    };
  }
}
