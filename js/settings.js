function renderSettingsForm() {
    const workspace = loadWorkspace();
    const settings = workspace.settings || defaultWorkspace.settings;

    $("#toolNameInput").val(settings.toolName || "NightCity DevTools");
    $("#darkModeToggle").prop("checked", Boolean(settings.darkMode));
    $("#compactSidebarToggle").prop("checked", Boolean(settings.compactSidebar));
    $("#consoleFontSizeInput").val(settings.consoleFontSize || 14);
    $("#consoleFontSizeLabel").text(settings.consoleFontSize || 14);

    renderWorkspaceSummary();
}

function saveSettings() {
    const workspace = loadWorkspace();

    workspace.settings = {
        toolName: $("#toolNameInput").val().trim() || "NightCity DevTools",
        darkMode: $("#darkModeToggle").is(":checked"),
        compactSidebar: $("#compactSidebarToggle").is(":checked"),
        consoleFontSize: Number($("#consoleFontSizeInput").val()) || 14
    };

    saveWorkspace(workspace);
    addActivityLog("Settings", "Saved settings", "Updated interface settings");
    $("#sidebarRoot").replaceWith(renderSidebar("settings"));
    applyThemeSettings();
    setActiveNav();
    renderSettingsForm();
    showStatus("Settings saved.", "success");
}

function toggleDarkMode() {
    const workspace = loadWorkspace();
    workspace.settings.darkMode = $("#darkModeToggle").is(":checked");
    saveWorkspace(workspace);
    applyThemeSettings();
}

function toggleCompactSidebar() {
    const workspace = loadWorkspace();
    workspace.settings.compactSidebar = $("#compactSidebarToggle").is(":checked");
    saveWorkspace(workspace);
    applyThemeSettings();
}

function exportWorkspace() {
    const workspace = loadWorkspace();
    downloadJson("browser-devtools-workspace.json", {
        exportedAt: new Date().toISOString(),
        workspace
    });

    addActivityLog("Settings", "Exported workspace", "Downloaded full workspace JSON");
    renderWorkspaceSummary();
    showStatus("Workspace export started.", "success");
}

function importWorkspace(event) {
    const file = event.target.files && event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function () {
        try {
            const parsed = JSON.parse(reader.result);
            const importedWorkspace = parsed.workspace || parsed;

            const merged = $.extend(true, cloneDefaultWorkspace(), importedWorkspace);
            saveWorkspace(merged);
            addActivityLog("Settings", "Imported workspace", `Imported ${file.name}`);

            $("#sidebarRoot").replaceWith(renderSidebar("settings"));
            applyThemeSettings();
            setActiveNav();
            renderSettingsForm();
            showStatus("Workspace imported successfully.", "success");
        } catch (error) {
            showStatus("Import failed. The selected file is not valid workspace JSON.", "danger");
        }

        $("#importWorkspaceInput").val("");
    };

    reader.readAsText(file);
}

function resetDemoWorkspace() {
    const workspace = loadWorkspace();
    workspace.targetHtml = defaultTargetHtml;
    workspace.selectedElementPath = "";
    saveWorkspace(workspace);

    addActivityLog("Settings", "Reset target page", "Restored default sample target HTML");
    renderWorkspaceSummary();
    showStatus("Default sample target restored.", "success");
}

function clearCapturedData() {
    const workspace = loadWorkspace();
    workspace.consoleHistory = [];
    workspace.networkLog = [];
    workspace.performanceLog = [];
    saveWorkspace(workspace);

    addActivityLog("Settings", "Cleared captured data", "Removed console, network, and performance logs");
    renderWorkspaceSummary();
    showStatus("Captured data cleared.", "success");
}

function clearWorkspace() {
    localStorage.removeItem(WORKSPACE_KEY);
    resetWorkspace();

    $("#sidebarRoot").replaceWith(renderSidebar("settings"));
    applyThemeSettings();
    setActiveNav();
    renderSettingsForm();
    showStatus("Workspace reset to defaults.", "success");
}

function renderWorkspaceSummary() {
    const workspace = loadWorkspace();

    $("#workspaceSummary").html(`
    <div class="summary-row">
      <span>Tool name</span>
      <span>${escapeHtml(workspace.settings.toolName)}</span>
    </div>
    <div class="summary-row">
      <span>Target DOM nodes</span>
      <span>${escapeHtml(countDomNodesFromHtml(workspace.targetHtml || ""))}</span>
    </div>
    <div class="summary-row">
      <span>Console entries</span>
      <span>${escapeHtml((workspace.consoleHistory || []).length)}</span>
    </div>
    <div class="summary-row">
      <span>Network entries</span>
      <span>${escapeHtml((workspace.networkLog || []).length)}</span>
    </div>
    <div class="summary-row">
      <span>Performance snapshots</span>
      <span>${escapeHtml((workspace.performanceLog || []).length)}</span>
    </div>
    <div class="summary-row">
      <span>Activity entries</span>
      <span>${escapeHtml((workspace.activityLog || []).length)}</span>
    </div>
    <div class="summary-row">
      <span>Target HTML size</span>
      <span>${escapeHtml(formatBytes((workspace.targetHtml || "").length))}</span>
    </div>
  `);
}

function bindSettingsEvents() {
    $("#saveSettingsBtn").on("click", saveSettings);
    $("#darkModeToggle").on("change", toggleDarkMode);
    $("#compactSidebarToggle").on("change", toggleCompactSidebar);

    $("#consoleFontSizeInput").on("input", function () {
        $("#consoleFontSizeLabel").text($(this).val());
    });

    $("#exportWorkspaceBtn").on("click", exportWorkspace);
    $("#importWorkspaceInput").on("change", importWorkspace);
    $("#resetDemoBtn").on("click", resetDemoWorkspace);
    $("#clearCapturedBtn").on("click", clearCapturedData);
    $("#clearWorkspaceBtn").on("click", clearWorkspace);
}

$(function () {
    $("#sidebarRoot").replaceWith(renderSidebar("settings"));
    applyThemeSettings();
    setActiveNav();

    renderSettingsForm();
    bindSettingsEvents();
});