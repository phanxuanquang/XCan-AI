import * as motion from './motion.js';

// Markdown rendering (Marked.js, global from CDN). Importing this module also installs the sanitizer.
export const escapeText = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Model output is untrusted: show raw HTML as text and neutralize script-capable URLs.
marked.use({
  renderer: {
    html: ({ text }) => escapeText(text),
  },
  walkTokens(token) {
    if ((token.type === 'link' || token.type === 'image') && /^\s*(javascript|vbscript|data):/i.test(token.href)) {
      token.href = '#';
    }
  },
});

// Styling lives in css/app.css (.paper-inner); only structural tweaks here.
// Render into a detached element, then morph the live DOM: unchanged blocks are kept,
// and with `fade` (streaming) new blocks / new words fade in.
export const renderMarkdown = (target, source, fade = false) => {
  const fresh = document.createElement('div');
  fresh.innerHTML = marked.parse(source);
  fresh.querySelectorAll('table').forEach((t) => {
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    t.replaceWith(wrap);
    wrap.append(t);
  });
  fresh.querySelectorAll('a').forEach((a) => Object.assign(a, { target: '_blank', rel: 'noopener noreferrer' }));
  motion.morph(target, fresh, fade);
};
