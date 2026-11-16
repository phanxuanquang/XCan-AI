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

const MAX_SIZE = 10 * 1024 * 1024;

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const el = {
  status: $("model-status"),
  boot: $("boot"),
  bootSpinner: $("boot-spinner"),
  pill: $("status-pill"),
  drop: $("dropzone"),
  workspace: $("workspace"),
  scanFrame: $("scan-frame"),
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
  download: $("download-btn"),
  themeToggle: $("theme-toggle"),
  loading: $("loading"),
  loadingText: $("loading-text"),
  loadingTime: $("loading-time"),
  skeleton: $("preview-skeleton"),
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
  controller: null, // AbortController of running generation
};

// ---------- Helpers ----------
const toast = (message) => {
  $("toast-body").textContent = message;
  bootstrap.Toast.getOrCreateInstance($("toast")).show();
};

const showError = (message) => {
  el.error.textContent = message;
  el.error.classList.toggle("d-none", !message);
};

const busy = () => state.controller !== null;

const refreshButtons = () => {
  el.generate.disabled = !provider?.isReady || !state.image || busy();
  el.clear.disabled = busy();
  el.stop.classList.toggle("d-none", !busy());
  el.file.disabled = busy();
  el.revert.classList.toggle(
    "d-none",
    !state.original || el.code.value === state.original,
  );
  el.copy.disabled = el.download.disabled = !el.code.value.trim() || busy();
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

// Header dot always shows the model state ('checking' | 'action' | 'blocked' | 'ready').
// Until 'ready', the boot screen explains what is happening and the workspace stays hidden.
const setStatus = (dotState, dotText, boot = null) => {
  if (el.pill.dataset.state !== dotState)
    motion.statusDot(el.pill.querySelector(".dot"), dotState);
  el.pill.dataset.state = dotState;
  setTip(el.pill, dotText);
  el.bootSpinner.classList.toggle("d-none", dotState !== "checking");
  if (boot) {
    el.status.innerHTML = `${boot.icon ? `<span class="material-symbols-rounded" aria-hidden="true">${boot.icon}</span>` : ""}
      <div>${boot.html}</div>${boot.extra || ""}`;
    motion.fadeIn(el.status, 6);
  }
  if (dotState !== "ready") return;
  el.boot.hidden = true;
  el.workspace.hidden = false;
  motion.fadeIn(el.workspace, 14);
};

// Workspace shows only the drop pane ('input') or only the live preview ('result').
const setView = (view) => {
  if (el.workspace.dataset.view === view) return;
  el.workspace.dataset.view = view;
  motion.fadeIn(view === "result" ? el.output : el.drop.closest(".pane"), 14);
  bootstrap.Tooltip.getInstance(el.clear)?.hide();
};

// Result pane shows one of: empty hint, skeleton (waiting for first token), rendered Markdown.
const showResult = (view) => {
  if (view === "rendered" && el.rendered.classList.contains("d-none"))
    motion.fadeIn(el.rendered);
  motion.skeleton(el.skeleton, view === "skeleton");
  el.empty.classList.toggle("d-none", view !== "empty");
  el.skeleton.classList.toggle("d-none", view !== "skeleton");
  el.rendered.classList.toggle("d-none", view !== "rendered");
};

// Loading: highlighter scan over the image, progress line with elapsed time, spinner on the button.
let loadingTimer = null;
const setLoading = (on, label = "") => {
  if (on) motion.startScan(el.scanFrame);
  else motion.stopScan(el.scanFrame);
  el.loading.classList.toggle("d-none", !on);
  el.generate.querySelector(".spinner-border").classList.toggle("d-none", !on);
  el.generate
    .querySelector(".material-symbols-rounded")
    .classList.toggle("d-none", on);
  clearInterval(loadingTimer);
  if (!on) return;
  el.loadingText.textContent = label;
  const t0 = Date.now();
  el.loadingTime.textContent = "0 s";
  loadingTimer = setInterval(() => {
    el.loadingTime.textContent = `${Math.floor((Date.now() - t0) / 1000)} s`;
  }, 1000);
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
  dotState,
  dotText,
  help,
  { icon, docs = provider.docs, confirm, onConfirm } = {},
) {
  const open = () => showInfo({ ...help, docs, confirm, onConfirm });
  setStatus(dotState, dotText, {
    icon,
    html: `<strong>${escapeText(help.title)}</strong>`,
    extra: `<button id="boot-action" class="btn-ink" type="button">${confirm ? "Download model" : "Read more"}</button>`,
  });
  $("boot-action").addEventListener("click", open);
  open();
}

async function checkModel() {
  if (!provider) {
    needsUser(
      "blocked",
      "Browser not supported",
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
      "blocked",
      "Built-in AI is off",
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
      "action",
      "Model download needed",
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
    needsUser("blocked", "Device not supported", help, { icon: "memory" });
  }
}

// Create the long-lived model session; with `download`, show progress while the model downloads.
async function startSession(download = false) {
  setStatus(
    "checking",
    download ? "Downloading model" : "Loading model",
    download
      ? {
          html: `<strong>Downloading the model</strong><br>Keep this tab open. This can take a while.
      <div class="progress mt-3" role="progressbar" aria-label="Model download" aria-valuemin="0" aria-valuemax="100">
        <div id="download-bar" class="progress-bar" style="width: 0%"></div>
      </div>
      <div id="download-pct" class="download-pct" aria-live="polite">Starting download…</div>`,
        }
      : {
          html: "<strong>Preparing XCan</strong><br>Loading the on-device model. This takes a few seconds.",
        },
  );
  try {
    await provider.init(
      SYSTEM_PROMPT,
      download
        ? (fraction) => {
            const pct = Math.round(fraction * 100);
            $("download-bar").style.width = `${pct}%`; // Bootstrap animates the width
            $("download-bar").parentElement.setAttribute("aria-valuenow", pct);
            // At 100% the browser still extracts and loads the model: show an indeterminate bar
            // (developer.chrome.com/docs/ai/inform-users-of-model-download).
            $("download-bar").classList.toggle(
              "progress-bar-striped",
              pct >= 100,
            );
            $("download-bar").classList.toggle(
              "progress-bar-animated",
              pct >= 100,
            );
            $("download-pct").textContent =
              pct < 100
                ? `${pct}% downloaded`
                : "Downloaded. Extracting and loading the model…";
            setTip(el.pill, `Downloading model ${pct}%`);
          }
        : undefined,
    );
    setStatus(
      "ready",
      `Ready: built-in AI of ${provider.name}. Images stay on this device.`,
    );
    refreshButtons();
  } catch (err) {
    needsUser(
      "blocked",
      "Model failed to load",
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
    toast("This file is not an image. Choose a PNG, JPG, WEBP or GIF.");
    return;
  }
  if (file.size > MAX_SIZE) {
    toast("This image is over 10 MB. Choose a smaller one.");
    return;
  }
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.image = file;
  state.imageUrl = URL.createObjectURL(file);
  el.img.src = state.imageUrl;
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
  showResult("skeleton");
  setLoading(true, "Reading the image");
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
        el.loadingText.textContent = "Writing Markdown";
        el.code.value = text;
        el.code.scrollTop = el.code.scrollHeight;
        renderMarkdown(el.rendered, text, true);
      },
    });
    const result = parseOcr(raw);
    el.code.value = result.textFound ? result.markdown : "";
    toast(
      result.textFound
        ? "Converted to Markdown"
        : "No text found in this image",
    );
  } catch (err) {
    if (err.name === "AbortError")
      toast("Conversion stopped. Partial result kept.");
    else showError(provider.describeError(err));
  } finally {
    setLoading(false);
    // Keep whatever streamed so far, even after stop/error.
    state.original = unwrapFence(el.code.value);
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
  Object.assign(state, { image: null, imageUrl: null, original: "" });
  el.file.value = "";
  el.img.removeAttribute("src");
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
  renderMarkdown(el.rendered, el.code.value);
  showResult(el.code.value.trim() ? "rendered" : "empty");
  refreshButtons();
});

el.revert.addEventListener("click", () => {
  el.code.value = state.original;
  renderMarkdown(el.rendered, state.original);
  showResult(state.original ? "rendered" : "empty");
  refreshButtons();
  toast("Edits undone");
});

el.copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(el.code.value);
    motion.confirmIcon(el.copy);
  } catch {
    toast(
      "Copy blocked by the browser. Select the text in the Markdown tab instead.",
    );
  }
});

el.download.addEventListener("click", () => {
  const url = URL.createObjectURL(
    new Blob([el.code.value], { type: "text/markdown" }),
  );
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: "xcan-output.md",
  });
  a.click();
  URL.revokeObjectURL(url);
  motion.confirmIcon(el.download, "download_done");
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

checkModel();
