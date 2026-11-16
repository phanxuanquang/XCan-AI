/**
 * Contract every browser AI backend must implement.
 * The app only talks to this interface; it never calls `LanguageModel` directly.
 *
 * Lifecycle: availability() → init() once (loads/downloads the model, keeps a session)
 * → generate() any number of times → destroy() when the page closes.
 *
 * @typedef {'available' | 'downloadable' | 'downloading' | 'unavailable'} Availability
 *
 * @typedef {object} GenerateRequest
 * @property {string} prompt        User text sent with the image.
 * @property {Blob} image           Image to analyze.
 * @property {AbortSignal} [signal] Cancels the generation.
 * @property {object} [responseConstraint] JSON Schema the reply must follow (structured output).
 * @property {(text: string) => void} [onChunk] Called with the full text so far on each streamed chunk.
 */
export class AiProvider {
  /** Display name, e.g. "Google Chrome". */
  get name() { throw new Error('not implemented'); }

  /** True when the browser exposes the API at all. */
  isSupported() { throw new Error('not implemented'); }

  /** True after init() succeeded and before destroy(). */
  get isReady() { throw new Error('not implemented'); }

  /** @returns {Promise<Availability>} */
  async availability() { throw new Error('not implemented'); }

  /**
   * Load the model and create the long-lived session with the system prompt.
   * If the model is not on the device yet this downloads it, which must run from a user gesture.
   * @param {string} system System instruction kept for the whole session.
   * @param {(fraction: number) => void} [onProgress] Download progress in [0, 1].
   */
  async init(system, onProgress) { throw new Error('not implemented'); }

  /**
   * Run one conversion on the initialized session.
   * @param {GenerateRequest} request
   * @returns {Promise<string>} full response text
   */
  async generate(request) { throw new Error('not implemented'); }

  /** Release the session (call on page exit). */
  destroy() { throw new Error('not implemented'); }

  /** Links to the browser's official docs: [{ label, url }]. */
  get docs() { throw new Error('not implemented'); }

  /**
   * Help shown in a dialog when the model must be downloaded or cannot run.
   * @returns {{ title: string, md: string }} md = Markdown, rendered by the app
   */
  setupHelp(availability) { throw new Error('not implemented'); }

  /**
   * What this page can check about the device when the model is unavailable.
   * @returns {Promise<Array<[boolean | null, string]>>} [met (null = cannot tell), label]
   */
  async checks(availability) { throw new Error('not implemented'); }

  /** Map a thrown error to a user-facing message. */
  describeError(error) { throw new Error('not implemented'); }
}
