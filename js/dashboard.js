let dashboardIframe = null;
let dashboardFps = 0;
let dashboardFrames = 0;
let dashboardLastFpsTime = performance.now();

function renderDashboardStats() {
    const workspace = loadWorkspace();
    const nodeCount = countDomNodesFromHtml(workspace.targetHtml || "");
    const consoleCount = (workspace.consoleHistory || []).length;
    const networkCount = (workspace.networkLog || []).length;

    $("#dashboardStats").html(`
    <div class="metric-card">
      <p class="metric-label">DOM nodes</p>
      <p class="metric-value">${nodeCount}</p>
    </div>
    <div class="metric-card">
      <p class="metric-label">Console entries</p>
      <p class="metric-value">${consoleCount}</p>
    </div>
    <div class="metric-card">
      <p class="metric-label">Network requests</p>
      <p class="metric-value">${networkCount}</p>
    </div>
    <div class="metric-card">
      <p class="metric-label">Current FPS</p>
      <p class="metric-value" id="dashboardFps">${dashboardFps}</p>
    </div>
  `);
}

function renderTargetPreview() {
    dashboardIframe = renderTargetIframe("targetPreview");

    $(dashboardIframe).on("load", function () {
        showStatus("Target preview loaded.", "success");
    });
}

function renderActivityList() {
    const workspace = loadWorkspace();
    const entries = (workspace.activityLog || []).slice(0, 8);

    if (!entries.length) {
        $("#activityList").html(renderEmptyState("No activity has been recorded yet."));
        return;
    }

    $("#activityList").html(entries.map((entry) => `
    <div class="activity-item">
      <strong>${escapeHtml(entry.module)} · ${escapeHtml(entry.action)}</strong>
      <p>${escapeHtml(entry.detail)}</p>
      <p>${escapeHtml(formatTimestamp(entry.createdAt))}</p>
    </div>
  `).join(""));
}

function loadSampleTargetPage() {
    seedDefaultTargetPage();
    renderTargetPreview();
    renderDashboardStats();
    renderActivityList();
    $("#targetHtmlEditor").val(loadWorkspace().targetHtml);
    showStatus("Sample target page loaded.", "success");
}

function editTargetHtml() {
    const workspace = loadWorkspace();
    const value = $("#targetHtmlEditor").val().trim();

    if (!value) {
        showStatus("Target HTML cannot be empty.", "warning");
        return;
    }

    workspace.targetHtml = value;
    saveWorkspace(workspace);
    addActivityLog("Dashboard", "Edited target HTML", "Custom HTML was saved to workspace.targetHtml");

    renderTargetPreview();
    renderDashboardStats();
    renderActivityList();

    const modalEl = document.getElementById("htmlEditorModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    showStatus("Target HTML saved and preview refreshed.", "success");
}

function resetTargetPage() {
    const workspace = loadWorkspace();
    workspace.targetHtml = defaultTargetHtml;
    workspace.selectedElementPath = "";
    saveWorkspace(workspace);
    addActivityLog("Dashboard", "Reset target page", "Target page restored to the default sample document");

    renderTargetPreview();
    renderDashboardStats();
    renderActivityList();
    $("#targetHtmlEditor").val(defaultTargetHtml);
    showStatus("Target page reset to default.", "success");
}

function startDashboardFpsCounter() {
    function tick(now) {
        dashboardFrames += 1;

        if (now - dashboardLastFpsTime >= 1000) {
            dashboardFps = Math.round((dashboardFrames * 1000) / (now - dashboardLastFpsTime));
            dashboardFrames = 0;
            dashboardLastFpsTime = now;
            $("#dashboardFps").text(dashboardFps);
        }

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

$(function () {
    $("#sidebarRoot").replaceWith(renderSidebar("dashboard"));
    applyThemeSettings();
    setActiveNav();

    const workspace = loadWorkspace();
    $("#targetHtmlEditor").val(workspace.targetHtml || defaultTargetHtml);

    renderDashboardStats();
    renderTargetPreview();
    renderActivityList();
    startDashboardFpsCounter();

    $("#loadSampleBtn").on("click", loadSampleTargetPage);
    $("#saveHtmlBtn").on("click", editTargetHtml);
    $("#resetTargetBtn").on("click", resetTargetPage);

    $("#htmlEditorModal").on("show.bs.modal", function () {
        $("#targetHtmlEditor").val(loadWorkspace().targetHtml || defaultTargetHtml);
    });
});