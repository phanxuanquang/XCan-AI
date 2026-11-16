// OCR contract with the model: prompts, structured-output schema, and parsing of its (streaming) reply.

// Compressed for a small on-device model: most important rule first, "no text" escape hatch last and narrow.
// No backticks inside: code fences are written as ~~~ (valid GFM).
export const SYSTEM_PROMPT = `Transcribe ALL text in the image to GitHub Markdown, in reading order. Handwriting, blurry, stylized or odd-looking words: still transcribe, best guess. Keep original language; never translate.
Reply JSON: textFound (any text in image?), markdown (the transcription only).
markdown: only text written in the image. No title, caption, summary or description of the image. Never invent text or structure. Never repeat lines.
Match visible formatting:
- Headings # to ###### by visual hierarchy.
- Bold, italic, strikethrough, inline code where shown.
- Lists: "-" bullets, "1." numbered, nest 2 spaces per level. Checkboxes: "- [ ]" / "- [x]".
- Tables: pipe table, header row + alignment row (:--- :---: ---:).
- Code/commands/terminal/json: fence with ~~~ plus language, e.g. ~~~python.
- Quotes, notes, warnings, callouts: "> ".
- URLs: [text](url). Separators: ---.
- Pictures, logos, charts, icons: *[Image: short description]*.
- Math: inline code.
Blank line between paragraphs. No HTML tags.
Zero text in image: textFound false, markdown "".`;

export const USER_PROMPT = 'Transcribe this image following the rules.';

// Structured output: the model can only answer with these two fields, so no preamble,
// notes or wrapping fences can leak into the result. textFound comes first so the
// model decides it before writing.
export const OCR_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['textFound', 'markdown'],
  properties: {
    textFound: { type: 'boolean', description: 'true if the image contains any text, including handwriting' },
    markdown: {
      type: 'string',
      description: 'Only the text visible in the image, as GitHub Markdown. No title, caption or description that is not written in the image.',
    },
  },
};

// Read a string field from JSON that may still be streaming (unterminated): take the body up to
// the first unescaped quote, drop a half-received \uXXXX escape, and let JSON.parse decode it.
export const partialJsonString = (json, key) => {
  const m = json.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`));
  try { return m ? JSON.parse(`"${m[1].replace(/\\u[0-9a-fA-F]{0,3}$/, '')}"`) : ''; } catch { return ''; }
};

export const parseOcr = (raw) => {
  try {
    const { textFound, markdown } = JSON.parse(raw);
    return { textFound: textFound !== false, markdown: String(markdown ?? '') };
  } catch {
    return { textFound: true, markdown: partialJsonString(raw, 'markdown') };
  }
};

// Drop a code fence the model may wrap around the whole answer.
export const unwrapFence = (text) => {
  const m = text.trim().match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
  return (m ? m[1] : text).trim();
};
