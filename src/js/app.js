import { createAiProvider, allDocs } from "./ai/index.js";
import * as motion from "./motion.js";
import {
  SYSTEM_PROMPT,
  USER_PROMPT,
  OCR_SCHEMA,
  partialJsonString,
  parseOcr,
  unwrapFence,
} from "./ocr.js";
import { escapeText, renderMarkdown } from "./markdown.js";
import { translateMarkdown } from "./translate.js";

const MAX_SIZE = 10 * 1024 * 1024;

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const el = {
  status: $("model-status"),
  boot: $("boot"),
  bootSpinner: $("boot-spinner"),
  drop: $("dropzone"),
  workspace: $("workspace"),
  file: $("file-input"),
  img: $("preview-image"),
  empty: $("empty-result"),
  generate: $("generate-btn"),
  stop: $("stop-btn"),
  clear: $("clear-btn"),
  error: $("error"),
  output: $("output"),
  rendered: $("output-rendered"),
  code: $("output-code"),
  revert: $("revert-btn"),
  copy: $("copy-btn"),
  translateWrap: $("translate-wrap"),
  translate: $("translate-btn"),
  translateMenu: $("translate-menu"),
  themeToggle: $("theme-toggle"),
  loadingText: $("loading-text"),
  loader: $("preview-loader"),
  info: $("info-dialog"),
  infoTitle: $("info-title"),
  infoBody: $("info-body"),
  infoConfirm: $("info-confirm"),
};

const provider = createAiProvider();

const state = {
  image: null, // File
  imageUrl: null, // object URL for preview
  original: "", // last generated Markdown
  translation: null, // translated Markdown shown in the Preview; the Edit tab keeps the source
  controller: null, // AbortController of running generation
};

// ---------- Helpers ----------
const dropError = (message) => {
  $("drop-error").textContent = message;
};

const showError = (message) => {
  el.error.textContent = message;
  el.error.classList.toggle("d-none", !message);
};

const busy = () => state.controller !== null;
const previewText = () => state.translation ?? el.code.value;

const refreshButtons = () => {
  el.generate.disabled = !provider?.isReady || !state.image || busy();
  el.clear.disabled = busy();
  el.stop.classList.toggle("d-none", !busy());
  el.file.disabled = busy();
  el.revert.classList.toggle(
    "d-none",
    !state.original ||
      (el.code.value === state.original && state.translation === null),
  );
  el.copy.disabled =
    el.translate.disabled =
      !el.code.value.trim() || busy();
};

// Tooltips for every element with data-bs-title; setTip keeps tooltip and aria-label in sync.
// Skipped on touch screens (tooltips stick after a tap); aria-label still names every icon.
const canHover = matchMedia("(hover: hover)").matches;
if (canHover)
  document
    .querySelectorAll("[data-bs-title]")
    .forEach((node) => new bootstrap.Tooltip(node));
const setTip = (node, text) => {
  node.setAttribute("aria-label", text);
  if (canHover)
    bootstrap.Tooltip.getOrCreateInstance(node).setContent({
      ".tooltip-inner": text,
    });
};

// Boot screen: covers the app until the model session is ready (spinner only while working).
const setBoot = ({ busy = false, icon, html, extra = "" }) => {
  el.bootSpinner.classList.toggle("d-none", !busy);
  el.status.innerHTML = `${icon ? `<span class="material-symbols-rounded" aria-hidden="true">${icon}</span>` : ""}
      <div>${html}</div>${extra}`;
};
const showWorkspace = () => {
  el.boot.hidden = true;
  el.workspace.hidden = false;
};

// Workspace shows only the drop pane ('input') or only the live preview ('result').
const setView = (view) => {
  if (el.workspace.dataset.view === view) return;
  el.workspace.dataset.view = view;
  // The tool sits under the landing hero: bring the live preview into view.
  if (view === "result")
    $("app").scrollIntoView({
      block: "start",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  bootstrap.Tooltip.getInstance(el.clear)?.hide();
};

// Result pane shows one of: empty hint, ring loader (waiting for the first token), rendered Markdown.
const showResult = (view) => {
  if (view === "rendered" && el.rendered.classList.contains("d-none"))
    motion.fadeIn(el.rendered);
  el.empty.classList.toggle("d-none", view !== "empty");
  el.loader.classList.toggle("d-none", view !== "loading");
  el.rendered.classList.toggle("d-none", view !== "rendered");
};

// ---------- Model availability & download ----------
// Help dialog = Bootstrap modal (getbootstrap.com/docs/5.3/components/modal).
const infoDialog = bootstrap.Modal.getOrCreateInstance(el.info);

/** Open the help dialog: explanation, official docs links, optional confirm action. */
function showInfo({ title, md, docs, confirm, onConfirm }) {
  el.infoTitle.textContent = title;
  const links = docs.map((d) => `- [${d.label}](${d.url})`).join("\n");
  el.infoBody.innerHTML = marked.parse(
    `${md}\n\n### Official documentation\n\n${links}`,
  );
  el.infoBody
    .querySelectorAll("a")
    .forEach((a) =>
      Object.assign(a, { target: "_blank", rel: "noopener noreferrer" }),
    );
  el.infoConfirm.hidden = !confirm;
  el.infoConfirm.textContent = confirm ?? "";
  // Runs inside the click, so it counts as the user gesture the model download needs.
  el.infoConfirm.onclick = () => {
    infoDialog.hide();
    onConfirm();
  };
  infoDialog.show();
}

/** Boot screen keeps a short line + a button; the details live in the dialog, opened right away. */
function needsUser(
  help,
  { icon, docs = provider.docs, confirm, onConfirm } = {},
) {
  const open = () => showInfo({ ...help, docs, confirm, onConfirm });
  setBoot({
    icon,
    html: `<strong>${escapeText(help.title)}</strong>`,
    extra: `<button id="boot-action" class="btn btn-ink" type="button">${confirm ? "Download model" : "Read more"}</button>`,
  });
  $("boot-action").addEventListener("click", open);
  open();
}

async function checkModel() {
  if (!provider) {
    needsUser(
      {
        title: "Open XCan in Chrome or Edge",
        md: "XCan reads images with the AI model built into **Google Chrome** or **Microsoft Edge** on a desktop computer. This browser does not have it.",
      },
      { icon: "block", docs: allDocs() },
    );
    return;
  }
  if (!provider.isSupported()) {
    needsUser(
      provider.setupHelp("unavailable"),
      { icon: "block" },
    );
    return;
  }

  const availability = await provider.availability();
  if (availability === "available") {
    await startSession(); // model already on the device: load it right away
  } else if (
    availability === "downloadable" ||
    availability === "downloading"
  ) {
    needsUser(
      provider.setupHelp(availability),
      {
        icon: "download",
        confirm: "Download model",
        onConfirm: () => startSession(true),
      },
    );
  } else {
    const help = provider.setupHelp(availability);
    const rows = (await provider.checks(availability)).map(([ok, label]) =>
      ok
        ? `- [x] ${label}`
        : ok === false
          ? `- [ ] **Missing:** ${label}`
          : `- [ ] ${label} *(cannot tell from a web page)*`,
    );
    help.md += `\n\n### Checked on this device\n\n${rows.join("\n")}`;
    needsUser(help, { icon: "memory" });
  }
}

// Create the long-lived model session; with `download`, show progress while the model downloads.
async function startSession(download = false) {
  setBoot(
    download
      ? {
          busy: true,
          html: `<strong>Downloading the model</strong><br>Keep this tab open. This can take a while.
      <div class="progress mt-3" role="progressbar" aria-label="Model download" aria-valuemin="0" aria-valuemax="100">
        <div id="download-bar" class="progress-bar" style="width: 0%"></div>
      </div>
      <div id="download-pct" class="small text-body-secondary mt-2" aria-live="polite">Starting download…</div>`,
        }
      : {
          busy: true,
          html: "<strong>Preparing XCan</strong><br>Loading the on-device model. This takes a few seconds.",
        },
  );
  try {
    await provider.init(
      SYSTEM_PROMPT,
      download
        ? (fraction) => {
            const pct = Math.round(fraction * 100);
            const bar = $("download-bar");
            const done = pct >= 100;
            bar.style.width = `${pct}%`; // Bootstrap animates the width
            bar.parentElement.setAttribute("aria-valuenow", pct);
            // At 100% the browser still extracts and loads the model: show an indeterminate bar
            // (developer.chrome.com/docs/ai/inform-users-of-model-download).
            bar.classList.toggle("progress-bar-striped", done);
            bar.classList.toggle("progress-bar-animated", done);
            $("download-pct").textContent = done
              ? "Downloaded. Extracting and loading the model…"
              : `${pct}% downloaded`;
          }
        : undefined,
    );
    showWorkspace();
    refreshButtons();
  } catch (err) {
    needsUser(
      {
        title: "The model could not be loaded",
        md: `${provider.describeError(err)}

Check free disk space and the network connection, then reload the page.`,
      },
      { icon: "error" },
    );
  }
}

// Release the session only when the user leaves the page.
addEventListener("pagehide", () => provider?.destroy());

// ---------- Image input ----------
function setImage(file) {
  if (!file || !provider?.isReady) return;
  if (!file.type.startsWith("image/")) {
    dropError("This file is not an image. Choose a PNG, JPG, WEBP or GIF.");
    return;
  }
  if (file.size > MAX_SIZE) {
    dropError("This image is over 10 MB. Choose a smaller one.");
    return;
  }
  dropError("");
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.image = file;
  state.imageUrl = URL.createObjectURL(file);
  el.img.src = $("image-full").src = state.imageUrl;
  setView("result");
  showError("");
  refreshButtons();
  generate();
}

el.file.addEventListener("change", () => setImage(el.file.files[0]));

el.drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (!busy()) el.drop.classList.add("dragging");
});
el.drop.addEventListener("dragleave", () =>
  el.drop.classList.remove("dragging"),
);
el.drop.addEventListener("drop", (e) => {
  e.preventDefault();
  el.drop.classList.remove("dragging");
  if (!busy()) setImage(e.dataTransfer.files[0]);
});

document.addEventListener("paste", (e) => {
  if (busy() || e.target === el.code) return;
  const item = [...(e.clipboardData?.items || [])].find((i) =>
    i.type.startsWith("image/"),
  );
  if (item) setImage(item.getAsFile());
});

// ---------- Generation ----------
async function generate() {
  if (!state.image || busy()) return;
  state.controller = new AbortController();
  showError("");
  el.code.value = "";
  el.code.readOnly = true;
  el.rendered.innerHTML = "";
  showResult("loading");
  el.loadingText.textContent = "Reading the image"; // announced to screen readers
  refreshButtons();

  try {
    const raw = await provider.generate({
      prompt: USER_PROMPT,
      image: state.image,
      responseConstraint: OCR_SCHEMA,
      signal: state.controller.signal,
      onChunk(json) {
        const text = partialJsonString(json, "markdown");
        if (!text) return;
        showResult("rendered");
        el.loadingText.textContent = "Reading the text";
        el.code.value = text;
        el.code.scrollTop = el.code.scrollHeight;
        renderMarkdown(el.rendered, text, true);
      },
    });
    const result = parseOcr(raw);
    el.code.value = result.textFound ? result.markdown : "";
    if (!result.textFound) showError("No text found in this image.");
  } catch (err) {
    if (err.name !== "AbortError") showError(provider.describeError(err));
  } finally {
    el.loadingText.textContent = "";
    // Keep whatever streamed so far, even after stop/error.
    state.original = unwrapFence(el.code.value);
    state.translation = null;
    el.code.value = state.original;
    renderMarkdown(el.rendered, state.original);
    showResult(state.original ? "rendered" : "empty");
    state.controller = null;
    el.code.readOnly = false;
    refreshButtons();
  }
}

el.generate.addEventListener("click", generate);
el.stop.addEventListener("click", () => state.controller?.abort());

el.clear.addEventListener("click", () => {
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  Object.assign(state, { image: null, imageUrl: null, original: "", translation: null });
  el.file.value = "";
  el.img.removeAttribute("src");
  $("image-full").removeAttribute("src");
  setView("input");
  el.code.value = "";
  el.rendered.innerHTML = "";
  showResult("empty");
  showError("");
  refreshButtons();
});

// ---------- Output actions ----------
el.code.addEventListener("input", () => {
  if (busy()) return;
  state.translation = null; // the source changed: an old translation no longer matches it
  renderMarkdown(el.rendered, el.code.value);
  showResult(el.code.value.trim() ? "rendered" : "empty");
  refreshButtons();
});

el.revert.addEventListener("click", () => {
  el.code.value = state.original;
  state.translation = null;
  renderMarkdown(el.rendered, state.original);
  showResult(state.original ? "rendered" : "empty");
  refreshButtons();
});

// ---------- Translation (Translator + Language Detector APIs) ----------
const langName = (code) =>
  new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
const nativeName = (code) =>
  new Intl.DisplayNames([code], { type: "language" }).of(code) ?? "";

function buildTranslateMenu() {
  const items = provider.translationLanguages
    .map((code) => ({ code, name: langName(code), native: nativeName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      ({ code, name, native }) =>
        `<li><button class="dropdown-item" type="button" data-lang="${code}" lang="${code}"><span lang="en">${escapeText(name)}</span>${native && native !== name ? `<small>${escapeText(native)}</small>` : ""}</button></li>`,
    );
  el.translateMenu.innerHTML = `<li><h6 class="dropdown-header">Translate to</h6></li>${items.join("")}`;
}

// The menu click is the user gesture that create() needs if a language pack must be downloaded.
// A translation only changes the Preview: the Markdown in the Edit tab stays the source, so every
// translation starts from it (never from an earlier translation).
async function translateTo(target) {
  const source = el.code.value;
  if (!source.trim() || busy()) return;
  state.controller = new AbortController();
  const { signal } = state.controller;
  showError("");
  el.loadingText.textContent = "Detecting the language";
  refreshButtons();
  const working = motion.scramble(el.rendered, true); // text keeps scrambling while translating
  let done = false;
  try {
    const from = await provider.detectLanguage(source);
    if (!from) {
      showError("Could not tell which language this text is in.");
      return;
    }
    if (from === target) {
      // Back to the source language: show the source itself instead of translating.
      if (state.translation === null) showError(`The text is already in ${langName(target)}.`);
      else {
        state.translation = null;
        done = true;
      }
      return;
    }
    const translator = await provider.createTranslator(from, target, (f) => {
      el.loadingText.textContent = `Downloading ${langName(from)} to ${langName(target)}: ${Math.round(f * 100)}%`;
    });
    if (!translator) {
      showError(`${langName(from)} to ${langName(target)} is not available in this browser.`);
      return;
    }
    el.loadingText.textContent = `Translating to ${langName(target)}`;
    el.code.readOnly = true;
    state.translation = await translateMarkdown(source, (text) =>
      translator.translate(text, { signal }),
    );
    done = true;
  } catch (err) {
    if (err.name !== "AbortError") showError(provider.describeError(err));
  } finally {
    el.loadingText.textContent = "";
    state.controller = null;
    el.code.readOnly = false;
    refreshButtons();
    // Stop the working scramble; a new translation scrambles into place.
    working?.revert();
    renderMarkdown(el.rendered, previewText());
    showResult("rendered");
    if (done) motion.scramble(el.rendered);
  }
}

if (provider?.canTranslate()) {
  buildTranslateMenu();
  el.translateWrap.hidden = false;
  el.translateMenu.addEventListener("click", (e) => {
    const lang = e.target.closest("[data-lang]")?.dataset.lang;
    if (!lang) return;
    bootstrap.Dropdown.getOrCreateInstance(el.translate).hide();
    bootstrap.Tooltip.getInstance(el.translateWrap)?.hide();
    translateTo(lang);
  });
}

el.copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(el.code.value);
    const icon = el.copy.querySelector(".material-symbols-rounded");
    icon.textContent = "check"; // brief confirmation
    setTimeout(() => (icon.textContent = "content_copy"), 1400);
  } catch {
    showError("Copy blocked by the browser. Select the text in the Edit tab instead.");
  }
});

// ---------- Theme ----------
const THEME_KEY = "xcan-theme";
const applyTheme = (theme) => {
  document.documentElement.dataset.bsTheme = theme;
  el.themeToggle.querySelector("span").textContent =
    theme === "dark" ? "light_mode" : "dark_mode";
};
let savedTheme = null;
try {
  savedTheme = localStorage.getItem(THEME_KEY);
} catch {
  /* storage blocked */
}
applyTheme(
  savedTheme ||
    (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"),
);
el.themeToggle.addEventListener("click", () => {
  const next =
    document.documentElement.dataset.bsTheme === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* storage blocked */
  }
});

motion.revealOnScroll();
checkModel();
