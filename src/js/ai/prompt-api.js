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

// Translator API languages listed in Chrome's docs (developer.chrome.com/docs/ai/translator-api).
// The list may change; Translator.availability() is the real check for each language pair.
const TRANSLATION_LANGUAGES = ['ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fr', 'he', 'hi', 'hr',
  'hu', 'id', 'it', 'ja', 'kn', 'ko', 'lt', 'mr', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sv', 'ta', 'te',
  'th', 'tr', 'uk', 'vi', 'zh', 'zh-Hant'];

export class PromptApiProvider extends AiProvider {
  #session = null;
  #detector = null;
  #translators = new Map(); // "source>target" → Translator, reused across runs

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

  // ---- Translation: Translator + Language Detector APIs (separate built-in models, same W3C family).
  canTranslate() { return 'Translator' in self && 'LanguageDetector' in self; }

  get translationLanguages() { return TRANSLATION_LANGUAGES; }

  // Docs: avoid very short text, and treat low confidence as unknown. 'und' = undetermined.
  async detectLanguage(text) {
    this.#detector ??= await LanguageDetector.create();
    const [top] = await this.#detector.detect(text);
    return top && top.detectedLanguage !== 'und' && top.confidence >= 0.5 ? top.detectedLanguage : null;
  }

  // Must run soon after a click: create() may download a language pack, which needs user activation.
  async createTranslator(sourceLanguage, targetLanguage, onProgress) {
    const key = `${sourceLanguage}>${targetLanguage}`;
    if (!this.#translators.has(key)) {
      if ((await Translator.availability({ sourceLanguage, targetLanguage })) === 'unavailable') return null;
      this.#translators.set(key, await Translator.create({
        sourceLanguage,
        targetLanguage,
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => onProgress(e.loaded)); // loaded is a 0-1 fraction
        },
      }));
    }
    return this.#translators.get(key);
  }

  destroy() {
    this.#session?.destroy();
    this.#session = null;
    this.#detector?.destroy();
    this.#detector = null;
    this.#translators.forEach((t) => t.destroy());
    this.#translators.clear();
  }

  describeError(error) {
    return COMMON_ERRORS[error?.name] ?? `Conversion failed in ${this.name}: ${error?.message || error}`;
  }
}
