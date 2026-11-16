import { PromptApiProvider } from './prompt-api.js';

// Chrome: Gemini Nano, Prompt API on the web from Chrome 148, multimodal (image) input.
// Help text is Markdown (rendered by the app); facts come from the official docs in `docs`.
const REQUIREMENTS = `
- At least 22 GB free on the drive that holds your Chrome profile. Chrome removes the model if free space drops below 10 GB.
- A GPU with more than 4 GB of VRAM, or 16 GB of RAM and 4 or more CPU cores.
- An unlimited or unmetered connection for the first download.
- Windows 10 or 11, macOS 13+, Linux, or ChromeOS on a Chromebook Plus. Phones are not supported.`;

export class ChromeAiProvider extends PromptApiProvider {
  get name() { return 'Google Chrome'; }

  get docs() {
    return [
      { label: 'Prompt API (Chrome for Developers)', url: 'https://developer.chrome.com/docs/ai/prompt-api' },
      { label: 'Built-in AI: hardware requirements', url: 'https://developer.chrome.com/docs/ai/get-started' },
    ];
  }

  // CPU path of the hardware rule. deviceMemory is rounded down and may be capped at 8,
  // so 8 means "unknown", below 8 means "under 16 GB".
  async checks(availability) {
    const cores = navigator.hardwareConcurrency;
    const ram = navigator.deviceMemory;
    return [
      ...await super.checks(availability),
      [cores >= 4, `Without a GPU: 4 or more CPU cores (found ${cores})`],
      [ram >= 16 || (ram < 8 ? false : null), `Without a GPU: 16 GB of RAM (browser reports ${ram ?? '?'} GB)`],
    ];
  }

  setupHelp(availability) {
    if (!this.isSupported()) {
      return {
        title: 'Update Chrome to use XCan',
        md: 'This version of Chrome does not have the Prompt API. It is available on the web from **Chrome 148** on desktop.',
      };
    }
    if (availability === 'downloadable' || availability === 'downloading') {
      return {
        title: 'Download the on-device model',
        md: `XCan reads your images with **Gemini Nano**, the AI model built into Chrome. Chrome downloads it once and shares it with every site that uses it. Your images never leave this device.

Before you start, check that this device has:
${REQUIREMENTS}`,
      };
    }
    return {
      title: 'This device cannot run the model',
      md: `Chrome reports that Gemini Nano with image input is not available here. It needs:
${REQUIREMENTS}

To see why, open \`chrome://on-device-internals\` and check the **Broker State** tab for errors.`,
    };
  }
}
