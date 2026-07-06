const WORKSPACE_KEY = "browserDevToolsClone.workspace";

const defaultTargetHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>NightCity Sample Target</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      font-family: Inter, system-ui, sans-serif;
      color: #f8fbff;
      background: linear-gradient(135deg, #08111f, #111827 52%, #24113f);
    }
    .page {
      min-height: 100vh;
      padding: 42px;
    }
    .hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 28px;
      border: 1px solid rgba(34, 211, 238, 0.35);
      border-radius: 22px;
      background: rgba(2, 6, 23, 0.74);
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.38);
    }
    .eyebrow {
      color: #22d3ee;
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    h1 {
      margin: 10px 0;
      font-size: clamp(32px, 5vw, 58px);
      line-height: 1;
    }
    .lead {
      max-width: 620px;
      color: #b8c7dd;
      font-size: 18px;
    }
    .cta {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      color: #031018;
      background: #22d3ee;
      font-weight: 800;
      cursor: pointer;
    }
    .cards {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 22px;
    }
    .card {
      flex: 1 1 180px;
      padding: 18px;
      border: 1px solid rgba(168, 85, 247, 0.35);
      border-radius: 18px;
      background: rgba(15, 23, 42, 0.72);
    }
    .card strong { color: #4ade80; }
    ul {
      padding-left: 20px;
      color: #d9e6f6;
    }
    .notice {
      margin-top: 20px;
      padding: 16px;
      border-left: 4px solid #a855f7;
      background: rgba(168, 85, 247, 0.14);
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero" data-panel="target-hero">
      <div>
        <div class="eyebrow">Live iframe target</div>
        <h1 id="headline">Inspect this page</h1>
        <p class="lead">This sample document is stored in localStorage and inspected by every Browser DevTools Clone panel.</p>
        <button class="cta" id="demoButton" type="button">Run target action</button>
      </div>
      <div class="notice">
        <strong>Status:</strong>
        <span id="statusText">Ready for inspection.</span>
      </div>
    </section>

    <section class="cards" aria-label="Sample cards">
      <article class="card">
        <strong>DOM</strong>
        <p>Edit real elements, attributes, and text content.</p>
      </article>
      <article class="card featured">
        <strong>CSS</strong>
        <p>Inspect computed styles and apply inline overrides.</p>
      </article>
      <article class="card">
        <strong>Network</strong>
        <p>Trigger requests from inside this iframe.</p>
      </article>
    </section>

    <ul class="feature-list">
      <li>Shared target HTML</li>
      <li>Inspectable style rules</li>
      <li>Real console messages</li>
    </ul>
  </main>

  <script>
    console.log("NightCity target page loaded");
    window.targetVersion = "1.0.0";
    document.getElementById("demoButton").addEventListener("click", function () {
      document.getElementById("statusText").textContent = "Button clicked at " + new Date().toLocaleTimeString();
      console.info("Target button clicked");
    });
  </script>
</body>
</html>`;

const defaultWorkspace = {
    settings: {
        toolName: "NightCity DevTools",
        darkMode: true,
        compactSidebar: false,
        consoleFontSize: 14
    },
    targetHtml: defaultTargetHtml,
    selectedElementPath: "",
    styleOverrides: {},
    consoleHistory: [
        {
            id: "console-seed-1",
            entryType: "output",
            level: "log",
            content: "NightCity target page loaded",
            createdAt: new Date().toISOString()
        },
        {
            id: "console-seed-2",
            entryType: "input",
            level: "log",
            content: "document.title",
            createdAt: new Date().toISOString()
        }
    ],
    networkLog: [
        {
            id: "network-seed-1",
            method: "GET",
            url: "https://jsonplaceholder.typicode.com/posts/1",
            status: 200,
            requestType: "fetch",
            sizeBytes: 1240,
            durationMs: 182,
            requestHeaders: {},
            responseHeaders: { "content-type": "application/json" },
            responseBodyPreview: "{ id: 1, title: 'Sample post' }",
            startedAt: new Date().toISOString()
        },
        {
            id: "network-seed-2",
            method: "GET",
            url: "https://api.example.com/private/report",
            status: 404,
            requestType: "XHR",
            sizeBytes: 318,
            durationMs: 96,
            requestHeaders: {},
            responseHeaders: { "content-type": "application/json" },
            responseBodyPreview: "{ error: 'Not found' }",
            startedAt: new Date().toISOString()
        },
        {
            id: "network-seed-3",
            method: "POST",
            url: "https://api.example.com/metrics",
            status: 500,
            requestType: "fetch",
            sizeBytes: 820,
            durationMs: 244,
            requestHeaders: { "content-type": "application/json" },
            responseHeaders: {},
            responseBodyPreview: "Internal server error",
            startedAt: new Date().toISOString()
        }
    ],
    performanceLog: [
        {
            id: "perf-seed-1",
            label: "Baseline Recording",
            avgFps: 58,
            minFps: 44,
            maxFps: 61,
            memoryUsedMB: 24.6,
            durationMs: 10000,
            createdAt: new Date().toISOString()
        },
        {
            id: "perf-seed-2",
            label: "Stress Test Snapshot",
            avgFps: 51,
            minFps: 35,
            maxFps: 60,
            memoryUsedMB: 31.2,
            durationMs: 8000,
            createdAt: new Date().toISOString()
        }
    ],
    activityLog: [
        {
            id: "log-seed-1",
            module: "Dashboard",
            action: "Workspace seeded",
            detail: "Default target page and demo logs were created",
            createdAt: new Date().toISOString()
        },
        {
            id: "log-seed-2",
            module: "Network Viewer",
            action: "Loaded sample requests",
            detail: "Seeded fetch and XHR examples",
            createdAt: new Date().toISOString()
        },
        {
            id: "log-seed-3",
            module: "Performance Monitor",
            action: "Loaded snapshots",
            detail: "Seeded baseline performance recordings",
            createdAt: new Date().toISOString()
        }
    ]
};

function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatTimestamp(dateString) {
    const date = dateString ? new Date(dateString) : new Date();
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
}

function cloneDefaultWorkspace() {
    return JSON.parse(JSON.stringify(defaultWorkspace));
}

function loadWorkspace() {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (!raw) {
        const seeded = cloneDefaultWorkspace();
        saveWorkspace(seeded);
        return seeded;
    }

    try {
        const parsed = JSON.parse(raw);
        return $.extend(true, cloneDefaultWorkspace(), parsed);
    } catch (error) {
        console.warn("Workspace parse failed. Resetting workspace.", error);
        return resetWorkspace();
    }
}

function saveWorkspace(workspace) {
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
    return workspace;
}

function resetWorkspace() {
    const workspace = cloneDefaultWorkspace();
    saveWorkspace(workspace);
    return workspace;
}

function seedDefaultTargetPage() {
    const workspace = loadWorkspace();
    workspace.targetHtml = defaultTargetHtml;
    addActivityLog("Dashboard", "Loaded sample target", "Default inspectable page restored");
    saveWorkspace(workspace);
    return workspace;
}

function addActivityLog(module, action, detail) {
    const workspace = loadWorkspace();
    workspace.activityLog = workspace.activityLog || [];
    workspace.activityLog.unshift({
        id: generateId("log"),
        module,
        action,
        detail,
        createdAt: new Date().toISOString()
    });
    workspace.activityLog = workspace.activityLog.slice(0, 80);
    saveWorkspace(workspace);
}

function renderTargetIframe(containerId) {
    const workspace = loadWorkspace();
    const iframeId = `${containerId}-iframe`;
    const html = `
    <div class="target-toolbar">
      <span class="target-url">localStorage://workspace.targetHtml</span>
      <span class="badge-soft">live iframe</span>
    </div>
    <div class="target-frame-wrap">
      <iframe id="${iframeId}" class="target-frame" sandbox="allow-scripts allow-forms allow-modals allow-same-origin"></iframe>
    </div>
  `;

    $(`#${containerId}`).html(html);
    const iframe = document.getElementById(iframeId);
    iframe.srcdoc = workspace.targetHtml || defaultTargetHtml;
    return iframe;
}

function getIframeDocument(iframeEl) {
    return iframeEl ? iframeEl.contentDocument || iframeEl.contentWindow.document : null;
}

function serializeIframeToTargetHtml(iframeEl) {
    const doc = getIframeDocument(iframeEl);
    if (!doc) return "";
    return `<!doctype html>\n${doc.documentElement.outerHTML}`;
}

function buildDomTree(rootElement) {
    function walk(node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return "";

        const path = getElementPath(node);
        const children = Array.from(node.children).map(walk).join("");
        const attrs = Array.from(node.attributes || [])
            .slice(0, 4)
            .map((attr) => ` <span class="dom-attr">${escapeHtml(attr.name)}="${escapeHtml(attr.value)}"</span>`)
            .join("");
        const text = Array.from(node.childNodes)
            .filter((child) => child.nodeType === Node.TEXT_NODE)
            .map((child) => child.textContent.trim())
            .filter(Boolean)
            .join(" ")
            .slice(0, 50);

        return `
      <div class="dom-branch" data-path="${escapeHtml(path)}">
        <div class="dom-node" data-path="${escapeHtml(path)}" style="padding-left:${Math.max(0, path.split(">").length - 1) * 14}px">
          <span class="dom-toggle">${children ? "▾" : "•"}</span>
          <span class="dom-tag">&lt;${node.tagName.toLowerCase()}</span>${attrs}<span class="dom-tag">&gt;</span>
          ${text ? `<span class="dom-text"> ${escapeHtml(text)}</span>` : ""}
        </div>
        ${children}
      </div>
    `;
    }

    return walk(rootElement);
}

function getElementPath(element) {
    if (!element || !element.ownerDocument) return "";
    const parts = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== current.ownerDocument.documentElement.parentElement) {
        const parent = current.parentElement;
        if (!parent) {
            parts.unshift(current.tagName.toLowerCase() + ":1");
            break;
        }

        const sameTagSiblings = Array.from(parent.children).filter((child) => child.tagName === current.tagName);
        const index = sameTagSiblings.indexOf(current) + 1;
        parts.unshift(`${current.tagName.toLowerCase()}:${index}`);
        current = parent;
    }

    return parts.join(">");
}

function resolveElementByPath(doc, path) {
    if (!doc || !path) return null;

    const parts = path.split(">");
    let current = doc.documentElement;

    for (let i = 0; i < parts.length; i += 1) {
        const [tag, indexRaw] = parts[i].split(":");
        const index = Number(indexRaw || 1) - 1;

        if (i === 0) {
            if (current.tagName.toLowerCase() !== tag) return null;
            continue;
        }

        const matches = Array.from(current.children).filter((child) => child.tagName.toLowerCase() === tag);
        current = matches[index];
        if (!current) return null;
    }

    return current;
}

function highlightElementOverlay(iframeEl, element) {
    const doc = getIframeDocument(iframeEl);
    if (!doc || !element || !iframeEl.contentWindow) return;

    doc.querySelectorAll(".devtools-highlight-overlay").forEach((overlay) => overlay.remove());

    const rect = element.getBoundingClientRect();
    const overlay = doc.createElement("div");
    overlay.className = "devtools-highlight-overlay";
    overlay.style.left = `${rect.left + iframeEl.contentWindow.scrollX}px`;
    overlay.style.top = `${rect.top + iframeEl.contentWindow.scrollY}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    doc.body.appendChild(overlay);

    setTimeout(() => {
        if (overlay.parentNode) overlay.remove();
    }, 2200);
}

function renderSidebar(activePage) {
    const workspace = loadWorkspace();
    const nav = [
        ["index.html", "Dashboard", "⌂", "dashboard"],
        ["dom-inspector.html", "DOM Inspector", "{}", "dom"],
        ["css-inspector.html", "CSS Inspector", "#", "css"],
        ["console.html", "Console", ">", "console"],
        ["network.html", "Network", "⇄", "network"],
        ["performance.html", "Performance", "↯", "performance"],
        ["settings.html", "Settings", "⚙", "settings"]
    ];

    return `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark">ND</div>
        <div class="brand-copy">
          <p class="brand-title">${escapeHtml(workspace.settings.toolName || "NightCity DevTools")}</p>
          <p class="brand-subtitle">Browser DevTools Clone</p>
        </div>
      </div>
      <ul class="nav-list">
        ${nav.map(([href, label, icon, key]) => `
          <li>
            <a class="nav-link ${activePage === key ? "active" : ""}" href="${href}" data-page="${key}">
              <span class="nav-icon">${escapeHtml(icon)}</span>
              <span class="nav-label">${escapeHtml(label)}</span>
            </a>
          </li>
        `).join("")}
      </ul>
      <div class="sidebar-footer">
        <strong>Workspace:</strong><br>
        localStorage-backed live target
      </div>
    </aside>
  `;
}

function setActiveNav() {
    const file = window.location.pathname.split("/").pop() || "index.html";
    $(".nav-link").removeClass("active");
    $(`.nav-link[href="${file}"]`).addClass("active");
}

function showStatus(message, type = "success") {
    const html = `<div class="status-message ${escapeHtml(type)}">${escapeHtml(message)}</div>`;
    const target = $(".status-region").first();

    if (target.length) {
        target.html(html);
        setTimeout(() => target.empty(), 3600);
    } else {
        console.log(message);
    }
}

function renderEmptyState(message) {
    return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function copyText(text, message = "Copied to clipboard") {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => showStatus(message));
        return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showStatus(message);
}

function applyThemeSettings() {
    const workspace = loadWorkspace();
    const settings = workspace.settings || {};
    document.body.classList.toggle("light-mode", !settings.darkMode);
    document.body.classList.toggle("compact-sidebar", Boolean(settings.compactSidebar));
    document.documentElement.style.setProperty("--console-font-size", `${settings.consoleFontSize || 14}px`);
}

function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function countDomNodesFromHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.querySelectorAll("*").length;
}

$(function () {
    loadWorkspace();
    applyThemeSettings();
    setActiveNav();
});