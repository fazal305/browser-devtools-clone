let networkIframe = null;
let selectedRequestId = "";

function normalizeHeaders(headers) {
    const normalized = {};

    if (!headers) return normalized;

    try {
        if (headers instanceof Headers) {
            headers.forEach((value, key) => {
                normalized[key] = value;
            });
            return normalized;
        }

        if (Array.isArray(headers)) {
            headers.forEach(([key, value]) => {
                normalized[key] = value;
            });
            return normalized;
        }

        Object.keys(headers).forEach((key) => {
            normalized[key] = headers[key];
        });
    } catch (error) {
        normalized.note = "Headers could not be serialized";
    }

    return normalized;
}

function persistNetworkEntry(entry) {
    const workspace = loadWorkspace();
    workspace.networkLog = workspace.networkLog || [];
    workspace.networkLog.unshift(entry);
    workspace.networkLog = workspace.networkLog.slice(0, 250);
    saveWorkspace(workspace);
    renderNetworkLog();

    if (!selectedRequestId) {
        renderRequestDetail(entry.id);
    }
}

function initNetworkHooks(iframeEl) {
    const win = iframeEl.contentWindow;

    if (!win || win.__devtoolsNetworkHooked) return;

    const originalFetch = win.fetch ? win.fetch.bind(win) : null;

    if (originalFetch) {
        win.fetch = async function (input, init = {}) {
            const startedAt = new Date().toISOString();
            const start = win.performance.now();
            const method = (init.method || (input && input.method) || "GET").toUpperCase();
            const url = typeof input === "string" ? input : input.url;
            const requestHeaders = normalizeHeaders(init.headers || (input && input.headers));

            try {
                const response = await originalFetch(input, init);
                const durationMs = Math.round(win.performance.now() - start);
                const clone = response.clone();
                let bodyText = "";

                try {
                    bodyText = await clone.text();
                } catch (error) {
                    bodyText = "[Response body unavailable]";
                }

                persistNetworkEntry({
                    id: generateId("network"),
                    method,
                    url,
                    status: response.status,
                    requestType: "fetch",
                    sizeBytes: bodyText.length,
                    durationMs,
                    requestHeaders,
                    responseHeaders: normalizeHeaders(response.headers),
                    responseBodyPreview: bodyText.slice(0, 1200),
                    startedAt
                });

                return response;
            } catch (error) {
                const durationMs = Math.round(win.performance.now() - start);

                persistNetworkEntry({
                    id: generateId("network"),
                    method,
                    url,
                    status: 0,
                    requestType: "fetch",
                    sizeBytes: 0,
                    durationMs,
                    requestHeaders,
                    responseHeaders: {},
                    responseBodyPreview: error.message || "Fetch failed",
                    startedAt
                });

                throw error;
            }
        };
    }

    const OriginalXHR = win.XMLHttpRequest;

    if (OriginalXHR) {
        win.XMLHttpRequest = function () {
            const xhr = new OriginalXHR();
            const startState = {
                method: "GET",
                url: "",
                requestHeaders: {},
                startedAt: "",
                startTime: 0
            };

            const originalOpen = xhr.open;
            const originalSetRequestHeader = xhr.setRequestHeader;
            const originalSend = xhr.send;

            xhr.open = function (method, url, ...rest) {
                startState.method = String(method || "GET").toUpperCase();
                startState.url = String(url || "");
                return originalOpen.call(xhr, method, url, ...rest);
            };

            xhr.setRequestHeader = function (name, value) {
                startState.requestHeaders[name] = value;
                return originalSetRequestHeader.call(xhr, name, value);
            };

            xhr.send = function (...args) {
                startState.startedAt = new Date().toISOString();
                startState.startTime = win.performance.now();

                xhr.addEventListener("loadend", function () {
                    const durationMs = Math.round(win.performance.now() - startState.startTime);
                    const responseText = typeof xhr.responseText === "string" ? xhr.responseText : "";
                    const responseHeadersRaw = xhr.getAllResponseHeaders ? xhr.getAllResponseHeaders() : "";
                    const responseHeaders = {};

                    responseHeadersRaw.trim().split(/[\r\n]+/).filter(Boolean).forEach((line) => {
                        const parts = line.split(": ");
                        const key = parts.shift();
                        responseHeaders[key] = parts.join(": ");
                    });

                    persistNetworkEntry({
                        id: generateId("network"),
                        method: startState.method,
                        url: startState.url,
                        status: xhr.status,
                        requestType: "XHR",
                        sizeBytes: responseText.length,
                        durationMs,
                        requestHeaders: startState.requestHeaders,
                        responseHeaders,
                        responseBodyPreview: responseText.slice(0, 1200),
                        startedAt: startState.startedAt
                    });
                });

                return originalSend.apply(xhr, args);
            };

            return xhr;
        };
    }

    win.__devtoolsNetworkHooked = true;
}

function getFilteredNetworkEntries() {
    const workspace = loadWorkspace();
    const type = $("#typeFilter").val() || "all";
    const status = $("#statusFilter").val() || "all";

    return (workspace.networkLog || []).filter((entry) => {
        const typeMatch = type === "all" || entry.requestType === type;
        const code = Number(entry.status);
        let statusMatch = true;

        if (status === "2xx") statusMatch = code >= 200 && code < 300;
        if (status === "4xx") statusMatch = code >= 400 && code < 500;
        if (status === "5xx") statusMatch = code >= 500 && code < 600;

        return typeMatch && statusMatch;
    });
}

function statusClass(status) {
    const code = Number(status);

    if (code >= 200 && code < 300) return "status-2xx";
    if (code >= 400 && code < 500) return "status-4xx";
    if (code >= 500 && code < 600) return "status-5xx";
    return "status-other";
}

function renderNetworkLog() {
    const entries = getFilteredNetworkEntries();

    if (!entries.length) {
        $("#networkTableBody").html(`
      <tr>
        <td colspan="7">${renderEmptyState("No network requests match the current filters.")}</td>
      </tr>
    `);
        return;
    }

    const maxDuration = Math.max(...entries.map((entry) => Number(entry.durationMs) || 1), 1);

    $("#networkTableBody").html(entries.map((entry) => {
        const width = Math.max(4, Math.round(((Number(entry.durationMs) || 1) / maxDuration) * 100));

        return `
      <tr class="network-row ${selectedRequestId === entry.id ? "selected" : ""}" data-id="${escapeHtml(entry.id)}">
        <td class="code-font">${escapeHtml(entry.method)}</td>
        <td class="network-url" title="${escapeHtml(entry.url)}">${escapeHtml(entry.url)}</td>
        <td><span class="status-badge ${statusClass(entry.status)}">${escapeHtml(entry.status)}</span></td>
        <td>${escapeHtml(entry.requestType)}</td>
        <td>${escapeHtml(formatBytes(entry.sizeBytes))}</td>
        <td class="code-font">${escapeHtml(entry.durationMs)}ms</td>
        <td>
          <div class="waterfall-track">
            <div class="waterfall-bar" style="width:${width}%"></div>
          </div>
        </td>
      </tr>
    `;
    }).join(""));
}

function simulateRequest() {
    const win = networkIframe && networkIframe.contentWindow;

    if (!win || !win.fetch) {
        showStatus("Target iframe is not ready.", "warning");
        return;
    }

    win.fetch("https://jsonplaceholder.typicode.com/posts/1")
        .then((response) => response.json())
        .then((data) => {
            if (win.console && win.console.info) {
                win.console.info("Simulated network request completed", data.title);
            }
            showStatus("Simulated fetch completed and captured.", "success");
        })
        .catch((error) => {
            showStatus(`Request finished with an error: ${error.message}`, "warning");
        });

    addActivityLog("Network Viewer", "Simulated request", "Triggered demo fetch inside the iframe");
}

function filterNetworkLog() {
    renderNetworkLog();

    if (selectedRequestId) {
        const stillVisible = getFilteredNetworkEntries().some((entry) => entry.id === selectedRequestId);
        if (!stillVisible) {
            selectedRequestId = "";
            $("#requestDetailSubtitle").text("Select a request");
            $("#requestDetailBody").html(renderEmptyState("Select a network row to inspect headers and response preview."));
        }
    }
}

function renderRequestDetail(id) {
    const workspace = loadWorkspace();
    const entry = (workspace.networkLog || []).find((item) => item.id === id);

    if (!entry) {
        $("#requestDetailSubtitle").text("Select a request");
        $("#requestDetailBody").html(renderEmptyState("Request not found."));
        return;
    }

    selectedRequestId = id;
    renderNetworkLog();

    $("#requestDetailSubtitle").text(`${entry.method} ${entry.status}`);

    $("#requestDetailBody").html(`
    <div class="detail-block">
      <h4>URL</h4>
      <div class="detail-pre">${escapeHtml(entry.url)}</div>
    </div>
    <div class="detail-block">
      <h4>Timing</h4>
      <div class="detail-pre">Started: ${escapeHtml(formatTimestamp(entry.startedAt))}
Duration: ${escapeHtml(entry.durationMs)}ms
Size: ${escapeHtml(formatBytes(entry.sizeBytes))}
Type: ${escapeHtml(entry.requestType)}</div>
    </div>
    <div class="detail-block">
      <h4>Request Headers</h4>
      <pre class="detail-pre">${escapeHtml(JSON.stringify(entry.requestHeaders || {}, null, 2))}</pre>
    </div>
    <div class="detail-block">
      <h4>Response Headers</h4>
      <pre class="detail-pre">${escapeHtml(JSON.stringify(entry.responseHeaders || {}, null, 2))}</pre>
    </div>
    <div class="detail-block">
      <h4>Response Body Preview</h4>
      <pre class="detail-pre">${escapeHtml(entry.responseBodyPreview || "[No preview available]")}</pre>
    </div>
  `);
}

function clearNetworkLog() {
    const workspace = loadWorkspace();
    workspace.networkLog = [];
    saveWorkspace(workspace);

    selectedRequestId = "";
    renderNetworkLog();
    $("#requestDetailSubtitle").text("Select a request");
    $("#requestDetailBody").html(renderEmptyState("Select a network row to inspect headers and response preview."));

    addActivityLog("Network Viewer", "Cleared network log", "Removed all persisted network entries");
    showStatus("Network log cleared.", "success");
}

function bindNetworkEvents() {
    $("#simulateRequestBtn").on("click", simulateRequest);
    $("#clearNetworkBtn").on("click", clearNetworkLog);
    $("#typeFilter, #statusFilter").on("change", filterNetworkLog);

    $("#networkTableBody").on("click", ".network-row", function () {
        renderRequestDetail($(this).data("id"));
    });
}

$(function () {
    $("#sidebarRoot").replaceWith(renderSidebar("network"));
    applyThemeSettings();
    setActiveNav();

    networkIframe = renderTargetIframe("networkTargetMount");

    $(networkIframe).on("load", function () {
        initNetworkHooks(networkIframe);
        renderNetworkLog();
        showStatus("Network hooks attached to iframe runtime.", "success");
    });

    renderNetworkLog();
    bindNetworkEvents();
});