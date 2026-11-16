import { ChromeAiProvider } from './chrome-provider.js';
import { EdgeAiProvider } from './edge-provider.js';

/**
 * Pick the provider for the current browser. Only Chrome and Edge are supported.
 * Uses User-Agent Client Hints brands (both browsers expose them); other
 * Chromium browsers (Brave, Opera, ...) do not list these brands and get null.
 * @returns {import('./ai-provider.js').AiProvider | null}
 */
export function createAiProvider() {
  const brands = navigator.userAgentData?.brands?.map((b) => b.brand) ?? [];
  if (brands.includes('Microsoft Edge')) return new EdgeAiProvider();
  if (brands.includes('Google Chrome')) return new ChromeAiProvider();
  return null;
}

/** Official docs of every supported browser (shown when the browser itself is not supported). */
export const allDocs = () => [...new ChromeAiProvider().docs, ...new EdgeAiProvider().docs];
