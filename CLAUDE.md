# XCan

Image → Markdown OCR that runs fully in the browser through the built-in Prompt API (`LanguageModel`). Static site for GitHub Pages. Docs: [docs/](docs/) (user guide, browser setup, architecture, development).

## Run

```sh
python -m http.server 8000 --directory src   # then open http://localhost:8000
```

No build, no package manager, no test framework. ES modules do not load from `file://`.

## Stack rules

- Semantic HTML + vanilla JS (ES modules) + CDN libs only: Bootstrap 5.3.3, Material Symbols Rounded, Marked.js 15.0.12, Anime.js 4.4.1. Pin exact versions. No npm deps, no build step.
- The site lives in `src/` and deploys via `.github/workflows/pages.yml`. Relative paths only; it must work under a sub-path.

## AI rules

- All AI goes through the `AiProvider` interface ([src/js/ai/ai-provider.js](src/js/ai/ai-provider.js)). App code never calls `LanguageModel` directly.
- Shared `LanguageModel` code lives in `prompt-api.js`; browser-specific text/help/checks go in `chrome-provider.js` / `edge-provider.js`. `index.js` picks one by UA-CH brand.
- Support Chrome and Edge only. Chrome: Gemini Nano, Prompt API on the web from Chrome 148. Edge: Canary/Dev 138+ behind a flag.
- Session lifecycle: one long-lived base session created at page load (model download must be triggered by a user click), `clone()` per conversion and destroy the clone, destroy the base session on `pagehide`.
- Never guess API facts, flags, error names, or hardware requirements. Check the official docs first:
  - Chrome: https://developer.chrome.com/docs/ai/prompt-api
  - Edge: https://learn.microsoft.com/microsoft-edge/web-platform/prompt-api
- Model output is untrusted: keep the Marked renderer escaping raw HTML and the `javascript:`/`data:` href filter in `src/js/markdown.js`.

## UI rules

- Desktop-first, mobile-friendly. No large empty areas.
- Minimal: icon buttons (Material Symbols) with tooltips (`data-bs-title`, kept in sync with `aria-label`).
- Monochrome only: black, white, greys. Theme tokens live in `src/css/app.css`.
- Help/setup text is Markdown, rendered by Marked in the Bootstrap modal, with links to the official docs.
- Animations go in `src/js/motion.js` via Anime.js, never hand-rolled; every effect honors `prefers-reduced-motion`.

## Verifying UI

- Look at the real page in **Chrome** through Playwright (MCP or `playwright-core`): snapshots/screenshots, plus a mobile-width resize. Do not judge UI from code alone.
- `tests/sample.webp` is the handwriting sample for end-to-end OCR runs. `tests/` is gitignored (local only).
- Do not test on Edge unless the user asks. If the Playwright MCP is attached to Edge, stop and tell the user.

## Workflow

- Update the matching page in `docs/` (and the history in `docs/development.md`) whenever a feature or flow changes.
- Commit only when asked.
