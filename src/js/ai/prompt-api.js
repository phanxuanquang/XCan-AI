import { AiProvider } from './ai-provider.js';

// Shared W3C Prompt API (`LanguageModel`) implementation of AiProvider.
// Chrome and Edge subclasses add only what differs: name, setup help, error wording.
//
// Session lifecycle: one base session is created up front (holding the system prompt) and kept
// for the page's lifetime. Each conversion runs on a clone of it, so runs never see each other's
// context, and the clone is destroyed when the run ends. The base session is destroyed on page exit.

const OPTIONS = {
  expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'image' }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

// Only errors the official docs name (developer.chrome.com/docs/ai/prompt-api).
const COMMON_ERRORS = {
  QuotaExceededError: 'The image is too large for the model. Crop it or use a smaller image.',
  NotSupportedError: 'The built-in model does not accept this input in this browser.',
};

export class PromptApiProvider extends AiProvider {
  #session = null;

  isSupported() { return 'LanguageModel' in self; }

  get isReady() { return this.#session !== null; }

  async availability() {
    try {
      return await LanguageModel.availability(OPTIONS);
    } catch (err) {
      console.error('LanguageModel.availability failed', err);
      return 'unavailable';
    }
  }

  // availability() only says 'unavailable', never why. Probing again without image input
  // separates "the model cannot run here" from "the model runs but not with images".
  async checks(availability) {
    const text = await LanguageModel.availability({ ...OPTIONS, expectedInputs: [OPTIONS.expectedInputs[0]] })
      .catch(() => 'unavailable');
    const runs = text !== 'unavailable';
    return [
      [!navigator.userAgentData?.mobile, 'A desktop or laptop computer'],
      [runs, `${this.name} can run its built-in model on this device`],
      [runs ? availability !== 'unavailable' : null, 'The model accepts image input in this browser'],
    ];
  }

  async init(system, onProgress) {
    this.#session ??= await LanguageModel.create({
      ...OPTIONS,
      initialPrompts: [{ role: 'system', content: system }],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => onProgress?.(e.total ? e.loaded / e.total : e.loaded));
      },
    });
  }

  async generate({ prompt, image, signal, onChunk, responseConstraint }) {
    if (!this.#session) throw new Error('The model session is not ready. Reload the page.');
    const session = await this.#session.clone({ signal });
    try {
      const stream = session.promptStreaming(
        [{ role: 'user', content: [{ type: 'text', value: prompt }, { type: 'image', value: image }] }],
        { signal, ...(responseConstraint && { responseConstraint }) },
      );
      let text = '';
      for await (const chunk of stream) {
        text += chunk;
        onChunk?.(text);
      }
      return text;
    } finally {
      session.destroy();
    }
  }

  destroy() {
    this.#session?.destroy();
    this.#session = null;
  }

  describeError(error) {
    return COMMON_ERRORS[error?.name] ?? `Conversion failed in ${this.name}: ${error?.message || error}`;
  }
}
