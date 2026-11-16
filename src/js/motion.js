// All motion goes through Anime.js v4 (global `anime` from CDN).
// Rule: animate only what changed because of the user, plus the scan while the model works.
// Every effect checks prefers-reduced-motion and falls back to an instant/static state.

const { animate, stagger, utils } = anime;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fade an element in, rising from `y` px (pane switch, notice, first rendered output). */
export function fadeIn(el, y = 0) {
  if (reduced()) return;
  animate(el, { opacity: [0, 1], y: [y, 0], duration: 360, ease: 'outCubic' });
}

// ---------- Status dot ----------
let dotPulse = null;

/** Pulse while loading; one pop when the state settles. */
export function statusDot(dot, state) {
  dotPulse?.revert();
  dotPulse = null;
  if (reduced()) return;
  if (state === 'checking') {
    dotPulse = animate(dot, { scale: [1, 1.45], opacity: [1, 0.45], duration: 650, ease: 'inOutSine', loop: true, alternate: true });
  } else {
    animate(dot, { scale: [1.8, 1], duration: 500, ease: 'outBack(2)' });
  }
}

// ---------- Scan over the thumbnail ----------
let scanAnims = [];

/** Highlighter line sweeps the image; swept area tinted. Static tint when motion is reduced. */
export function startScan(frame) {
  stopScan();
  const line = frame.querySelector('.scan-line');
  const sweep = frame.querySelector('.scan-sweep');
  // Percentages, so it works before the thumbnail has finished loading.
  utils.set([line, sweep], { opacity: 1 });
  if (reduced()) {
    utils.set(sweep, { height: '100%' });
    utils.set(line, { top: '50%' });
    return;
  }
  const loop = { duration: 1300, ease: 'inOutSine', loop: true, alternate: true };
  scanAnims = [
    animate(line, { top: ['0%', '96%'], ...loop }),
    animate(sweep, { height: ['0%', '100%'], ...loop }),
  ];
}

export function stopScan(frame) {
  scanAnims.forEach((a) => a.revert());
  scanAnims = [];
  if (!frame) return;
  utils.set(frame.querySelector('.scan-line'), { opacity: 0, top: '0%' });
  utils.set(frame.querySelector('.scan-sweep'), { opacity: 0, height: '0%' });
}

// ---------- Skeleton ----------
let skeletonAnim = null;

/** Placeholder lines breathe in sequence until the first token arrives. */
export function skeleton(el, on) {
  skeletonAnim?.revert();
  skeletonAnim = null;
  if (!on || reduced()) return;
  skeletonAnim = animate(el.querySelectorAll('.placeholder'), {
    opacity: [0.12, 0.38],
    delay: stagger(90),
    duration: 700,
    ease: 'inOutSine',
    loop: true,
    alternate: true,
  });
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

// ---------- Feedback ----------

/** Swap an icon button's glyph to a check mark with a small pop, then restore. */
export function confirmIcon(button, glyph = 'check') {
  const icon = button.querySelector('.material-symbols-rounded');
  const original = icon.textContent;
  icon.textContent = glyph;
  if (!reduced()) animate(icon, { scale: [0.4, 1], rotate: [-20, 0], duration: 420, ease: 'outBack(2.5)' });
  setTimeout(() => { icon.textContent = original; }, 1400);
}
