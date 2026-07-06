let consoleIframe = null;
let currentConsoleFilter = "all";
let commandHistory = [];
let historyIndex = -1;

function stringifyConsoleValue(value) {
    if (value instanceof Error) return value.stack || value.message;

    if (typeof value === "undefined") return "undefined";
    if (typeof value === "function") return value.toString();

    if (typeof value === "object" && value !== null) {
        try {
            return JSON.stringify(value, null, 2);
        } catch (error) {
            return Object.prototype.toString.call(value);
        }
    }

    return String(value);
}

function appendConsoleEntry(entryType, level, content) {
    const workspace = loadWorkspace();
    workspace.consoleHistory = workspace.consoleHistory || [];
    workspace.consoleHistory.push({
        id: generateId("console"),
        entryType,
        level,
        content: stringifyConsoleValue(content),
        createdAt: new Date().toISOString()
    });

    workspace.consoleHistory = workspace.consoleHistory.slice(-300);
    saveWorkspace(workspace);
    renderConsoleLog();
}

function initConsoleOverrides(iframeEl) {
    const win = iframeEl.contentWindow;

    if (!win || win.__devtoolsConsoleHooked) return;

    ["log", "info", "warn", "error"].forEach((level) => {
        const original = win.console[level].bind(win.console);

        win.console[level] = function (...args) {
            original(...args);
            appendConsoleEntry("output", level, args.map(stringifyConsoleValue).join(" "));
        };
    });

    win.addEventListener("error", function (event) {
        appendConsoleEntry("output", "error", event.message || "Unhandled target error");
    });

    win.__devtoolsConsoleHooked = true;
}

function executeCommand(commandText) {
    const command = String(commandText || "").trim();

    if (!command || !consoleIframe || !consoleIframe.contentWindow) return;

    appendConsoleEntry("input", "log", command);
    commandHistory.push(command);
    commandHistory = commandHistory.slice(-80);
    historyIndex = commandHistory.length;

    try {
        const result = consoleIframe.contentWindow.eval(command);
        appendConsoleEntry("output", "result", result);
    } catch (error) {
        appendConsoleEntry("output", "error", error);
    }

    $("#consoleCommand").val("");
    addActivityLog("Console", "Executed command", command.slice(0, 80));
}

function renderConsoleLog() {
    const workspace = loadWorkspace();
    const entries = workspace.consoleHistory || [];
    const filtered = currentConsoleFilter === "all"
        ? entries
        : entries.filter((entry) => entry.level === currentConsoleFilter);

    if (!filtered.length) {
        $("#consoleOutput").html(renderEmptyState("No console entries match this filter."));
        return;
    }

    $("#consoleOutput").html(filtered.map((entry) => `
    <div class="console-row level-${escapeHtml(entry.level)}">
      <span class="console-level">${escapeHtml(entry.entryType === "input" ? "input" : entry.level)}</span>
      <span class="console-content">${escapeHtml(entry.entryType === "input" ? `> ${entry.content}` : entry.content)}</span>
      <span class="console-time">${escapeHtml(formatTimestamp(entry.createdAt))}</span>
    </div>
  `).join(""));

    const output = document.getElementById("consoleOutput");
    output.scrollTop = output.scrollHeight;
}

function filterConsoleByLevel(level) {
    currentConsoleFilter = level || "all";
    $(".level-filter").removeClass("active");
    $(`.level-filter[data-level="${currentConsoleFilter}"]`).addClass("active");
    renderConsoleLog();
}

function navigateHistory(direction) {
    if (!commandHistory.length) return;

    historyIndex += direction;
    historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex));

    if (historyIndex === commandHistory.length) {
        $("#consoleCommand").val("");
    } else {
        $("#consoleCommand").val(commandHistory[historyIndex]);
    }
}

function clearConsole() {
    const workspace = loadWorkspace();
    workspace.consoleHistory = [];
    saveWorkspace(workspace);
    renderConsoleLog();
    addActivityLog("Console", "Cleared console", "Removed all persisted console entries");
    showStatus("Console cleared.", "success");
}

function bindConsoleEvents() {
    $("#runCommandBtn").on("click", function () {
        executeCommand($("#consoleCommand").val());
    });

    $("#consoleCommand").on("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            executeCommand($(this).val());
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            navigateHistory(-1);
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            navigateHistory(1);
        }
    });

    $(".level-filter").on("click", function () {
        filterConsoleByLevel($(this).data("level"));
    });

    $("#clearConsoleBtn").on("click", clearConsole);
}

$(function () {
    $("#sidebarRoot").replaceWith(renderSidebar("console"));
    applyThemeSettings();
    setActiveNav();

    commandHistory = (loadWorkspace().consoleHistory || [])
        .filter((entry) => entry.entryType === "input")
        .map((entry) => entry.content);
    historyIndex = commandHistory.length;

    consoleIframe = renderTargetIframe("consoleTargetMount");

    $(consoleIframe).on("load", function () {
        initConsoleOverrides(consoleIframe);
        renderConsoleLog();
        showStatus("Console attached to iframe runtime.", "success");
    });

    bindConsoleEvents();
});