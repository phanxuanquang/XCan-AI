// All motion goes through Anime.js v4 (global `anime` from CDN).
// Effects: landing blocks fade up once on scroll, the first render fades in, the live preview fades
// in new blocks and words while the model streams, and translation scrambles the text.
// Every effect checks prefers-reduced-motion and falls back to an instant/static state.

const { animate, scrambleText } = anime;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fade an element in (first rendered output). */
export function fadeIn(el) {
  if (reduced()) return;
  animate(el, { opacity: [0, 1], duration: 360, ease: 'outCubic' });
}

/**
 * Scramble every text run of `root` into place (animejs.com/documentation/text/scrambletext).
 * With `loop`, it keeps scrambling (translation in progress) until the returned animation is reverted.
 * scrambleText writes innerHTML, so only runs without HTML-significant characters are animated
 * (model output must never become markup); code blocks stay still too.
 */
export function scramble(root, loop = false) {
  if (reduced()) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      /\S/.test(n.data) && !/[<>&]/.test(n.data) && !n.parentElement.closest('pre, code')
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  const runs = [];
  for (let n; (n = walker.nextNode());) runs.push(n);
  const spans = runs.map((n) => {
    const span = document.createElement('span');
    span.textContent = n.data;
    n.replaceWith(span);
    return span;
  });
  return spans.length ? animate(spans, { innerHTML: scrambleText({ ease: 'inOut(3)', duration: 900 }), loop }) : null;
}

/** Landing page: each [data-reveal] block fades up once, the first time it scrolls into view. */
export function revealOnScroll() {
  const blocks = document.querySelectorAll('[data-reveal]');
  if (reduced()) return;
  blocks.forEach((b) => (b.style.opacity = 0));
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    // Drop the leftover transform: it would make a stacking context that traps the dropdown menu.
    animate(e.target, {
      opacity: [0, 1], y: [16, 0], duration: 600, ease: 'outCubic',
      onComplete: () => e.target.style.removeProperty('transform'),
    });
  }), { threshold: 0.15 });
  blocks.forEach((b) => io.observe(b));
}

// ---------- Live preview ----------

// Source HTML of each block as inserted (before Anime.js adds inline styles), used for diffing.
const SOURCE = Symbol('source');
const sourceOf = (node) => node[SOURCE] ?? (node.nodeType === 1 ? node.outerHTML : node.textContent);
const freshOf = (node) => (node.nodeType === 1 ? node.outerHTML : node.textContent);

/**
 * Update `target` to match `fresh` (a detached element with new rendered Markdown) without
 * re-rendering unchanged blocks. With `fade`, new blocks fade in and, when the last block only
 * grew, just its new text fades in (word-by-word feel while the model streams).
 */
export function morph(target, fresh, fade = false) {
  const oldNodes = [...target.childNodes];
  const newNodes = [...fresh.childNodes];
  let i = 0;
  while (i < oldNodes.length && i < newNodes.length && sourceOf(oldNodes[i]) === freshOf(newNodes[i])) i++;

  const grown = oldNodes[i];
  const prevText = grown?.nodeType === 1 ? grown.textContent : '';
  const prevTag = grown?.nodeName;
  oldNodes.slice(i).forEach((n) => n.remove());

  const added = newNodes.slice(i);
  added.forEach((n) => { n[SOURCE] = freshOf(n); });
  target.append(...added);
  if (!fade || reduced()) return;

  added.forEach((n, k) => {
    if (n.nodeType !== 1) return;
    // Same block still being written: fade only its new text (or nothing if its structure
    // changed, e.g. "[x]" became a checkbox), so it never flickers back to transparent.
    if (k === 0 && n.nodeName === prevTag) {
      if (n.textContent.startsWith(prevText)) fadeTail(n, prevText.length);
    } else {
      animate(n, { opacity: [0, 1], y: [6, 0], duration: 380, ease: 'outQuad' });
    }
  });
}

/** Wrap the text after `offset` characters of `el` in spans and fade them in. */
function fadeTail(el, offset) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const tail = [];
  let seen = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const len = node.textContent.length;
    if (seen + len <= offset) { seen += len; continue; }
    tail.push(seen < offset ? node.splitText(offset - seen) : node);
    seen += len;
  }
  const spans = tail.filter((t) => t.textContent.trim()).map((t) => {
    const span = document.createElement('span');
    t.replaceWith(span);
    span.append(t);
    return span;
  });
  if (spans.length) animate(spans, { opacity: [0, 1], duration: 450, ease: 'outQuad' });
}
