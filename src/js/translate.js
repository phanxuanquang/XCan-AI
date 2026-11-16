// Translate Markdown while keeping its syntax. The Translator API takes plain text, so only the
// text of each line is sent: code blocks, rules and table separators stay as they are, and
// heading/list/quote/checkbox markers and table pipes are kept around the translated text.
// Lines go one at a time: the API processes requests sequentially anyway.

const MARKER = /^(\s*(?:>\s*)*(?:#{1,6}\s+|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)?)(.*)$/;
const FENCE = /^\s*(```|~~~)/;
const KEEP = [
  /^\s*$/, // blank
  /^\s*([-*_]\s*){3,}$/, // horizontal rule
  /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/, // table separator row
];

export async function translateMarkdown(markdown, translate) {
  const lines = markdown.split('\n');
  const out = [];
  let fence = null;
  const text = async (s) => (/\p{L}/u.test(s) ? translate(s) : s); // skip numbers, symbols, empty cells

  for (const line of lines) {
    const f = line.match(FENCE);
    if (fence || f) {
      if (f && (!fence || f[1] === fence)) fence = fence ? null : f[1];
      out.push(line);
    } else if (KEEP.some((re) => re.test(line))) {
      out.push(line);
    } else if (/^\s*\|/.test(line)) {
      const cells = line.split('|');
      const end = cells.at(-1).trim() ? cells.length : cells.length - 1; // row may lack the closing pipe
      for (let i = 1; i < end; i++) {
        const [, lead, body, trail] = cells[i].match(/^(\s*)(.*?)(\s*)$/);
        cells[i] = lead + (await text(body)) + trail;
      }
      out.push(cells.join('|'));
    } else {
      const [, marker, body] = line.match(MARKER);
      out.push(marker + (await text(body)));
    }
  }
  return out.join('\n');
}
