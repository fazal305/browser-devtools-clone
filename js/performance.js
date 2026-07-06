let performanceIframe = null;
let fpsMonitorRunning = false;
let fpsFrameCount = 0;
let fpsLastTime = performance.now();
let currentFps = 0;

let isRecording = false;
let recordingStartedAt = 0;
let recordingSamples = [];
let fpsChart = null;

function startFpsMonitor() {
    if (fpsMonitorRunning) return;

    fpsMonitorRunning = true;

    function tick(now) {
        fpsFrameCount += 1;

        if (now - fpsLastTime >= 1000) {
            currentFps = Math.round((fpsFrameCount * 1000) / (now - fpsLastTime));
            fpsFrameCount = 0;
            fpsLastTime = now;
            $("#fpsValue").text(currentFps);

            if (isRecording) {
                const elapsed = Math.round(now - recordingStartedAt);
                recordingSamples.push({ t: elapsed, fps: currentFps });
                updatePerformanceChart();
            }

            updateMemoryReadout();
        }

        if (fpsMonitorRunning) {
            requestAnimationFrame(tick);
        }
    }

    requestAnimationFrame(tick);
}

function stopFpsMonitor() {
    fpsMonitorRunning = false;
}

function updateMemoryReadout() {
    if (performance.memory) {
        const used = performance.memory.usedJSHeapSize / (1024 * 1024);
        $("#memoryValue").text(`${used.toFixed(1)} MB`);
    } else {
        $("#memoryValue").text("Unavailable");
    }
}

function runStressTest() {
    const start = performance.now();
    let total = 0;

    for (let i = 0; i < 9000000; i += 1) {
        total += Math.sqrt(i) % 7;
    }

    const duration = performance.now() - start;
    $("#stressValue").text(`${duration.toFixed(0)}ms`);
    $("#stressResult")
        .removeClass("d-none")
        .text(`Stress test completed in ${duration.toFixed(2)}ms. Computed checksum: ${total.toFixed(2)}.`);

    addActivityLog("Performance Monitor", "Ran stress test", `Heavy loop completed in ${duration.toFixed(2)}ms`);
    showStatus("Stress test completed.", "success");
}

function startRecording() {
    isRecording = true;
    recordingStartedAt = performance.now();
    recordingSamples = [];

    $("#startRecordingBtn").prop("disabled", true);
    $("#stopRecordingBtn").prop("disabled", false);
    $("#recordingIndicator").removeClass("d-none");

    renderPerformanceChart();
    addActivityLog("Performance Monitor", "Started recording", "FPS timeline recording started");
    showStatus("Performance recording started.", "success");
}

function stopRecording() {
    if (!isRecording) return;

    isRecording = false;

    const durationMs = Math.round(performance.now() - recordingStartedAt);
    const fpsValues = recordingSamples.map((sample) => sample.fps);
    const avgFps = fpsValues.length
        ? Math.round(fpsValues.reduce((sum, value) => sum + value, 0) / fpsValues.length)
        : currentFps;
    const minFps = fpsValues.length ? Math.min(...fpsValues) : currentFps;
    const maxFps = fpsValues.length ? Math.max(...fpsValues) : currentFps;
    const memoryUsedMB = performance.memory
        ? Number((performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1))
        : null;

    const workspace = loadWorkspace();
    workspace.performanceLog = workspace.performanceLog || [];
    workspace.performanceLog.unshift({
        id: generateId("perf"),
        label: `Recording ${workspace.performanceLog.length + 1}`,
        avgFps,
        minFps,
        maxFps,
        memoryUsedMB,
        durationMs,
        createdAt: new Date().toISOString()
    });
    saveWorkspace(workspace);

    $("#startRecordingBtn").prop("disabled", false);
    $("#stopRecordingBtn").prop("disabled", true);
    $("#recordingIndicator").addClass("d-none");

    renderPerformanceSnapshots();
    addActivityLog("Performance Monitor", "Saved recording", `Captured ${durationMs}ms FPS recording`);
    showStatus("Performance recording saved.", "success");
}

function renderPerformanceChart() {
    const ctx = document.getElementById("fpsChart");

    if (!ctx || typeof Chart === "undefined") return;

    if (fpsChart) {
        fpsChart.destroy();
    }

    fpsChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "FPS",
                data: [],
                borderColor: "#22d3ee",
                backgroundColor: "rgba(34, 211, 238, 0.16)",
                borderWidth: 2,
                tension: 0.35,
                fill: true,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                    ticks: { color: "#9aabc7" },
                    grid: { color: "rgba(34, 211, 238, 0.12)" }
                },
                y: {
                    suggestedMin: 0,
                    suggestedMax: 75,
                    ticks: { color: "#9aabc7" },
                    grid: { color: "rgba(34, 211, 238, 0.12)" }
                }
            },
            plugins: {
                legend: {
                    labels: { color: "#f7fbff" }
                }
            }
        }
    });
}

function updatePerformanceChart() {
    if (!fpsChart) return;

    fpsChart.data.labels = recordingSamples.map((sample) => `${(sample.t / 1000).toFixed(0)}s`);
    fpsChart.data.datasets[0].data = recordingSamples.map((sample) => sample.fps);
    fpsChart.update();
}

function renderPerformanceSnapshots() {
    const workspace = loadWorkspace();
    const snapshots = workspace.performanceLog || [];

    if (!snapshots.length) {
        $("#snapshotList").html(renderEmptyState("No performance snapshots saved yet."));
        return;
    }

    $("#snapshotList").html(snapshots.map((snapshot) => `
    <div class="snapshot-card">
      <h3>${escapeHtml(snapshot.label)}</h3>
      <p class="panel-subtitle">${escapeHtml(formatTimestamp(snapshot.createdAt))}</p>
      <dl>
        <dt>Avg FPS</dt><dd>${escapeHtml(snapshot.avgFps)}</dd>
        <dt>Min FPS</dt><dd>${escapeHtml(snapshot.minFps)}</dd>
        <dt>Max FPS</dt><dd>${escapeHtml(snapshot.maxFps)}</dd>
        <dt>Memory</dt><dd>${snapshot.memoryUsedMB === null ? "Unavailable" : `${escapeHtml(snapshot.memoryUsedMB)} MB`}</dd>
        <dt>Duration</dt><dd>${escapeHtml(snapshot.durationMs)}ms</dd>
      </dl>
    </div>
  `).join(""));
}

function exportPerformanceReport() {
    const workspace = loadWorkspace();
    downloadJson("browser-devtools-performance-report.json", {
        exportedAt: new Date().toISOString(),
        performanceLog: workspace.performanceLog || [],
        latestSamples: recordingSamples
    });

    addActivityLog("Performance Monitor", "Exported report", "Downloaded performance report JSON");
    showStatus("Performance report exported.", "success");
}

function bindPerformanceEvents() {
    $("#runStressBtn").on("click", runStressTest);
    $("#startRecordingBtn").on("click", startRecording);
    $("#stopRecordingBtn").on("click", stopRecording);
    $("#exportPerfBtn").on("click", exportPerformanceReport);
}

$(function () {
    $("#sidebarRoot").replaceWith(renderSidebar("performance"));
    applyThemeSettings();
    setActiveNav();

    performanceIframe = renderTargetIframe("performanceTargetMount");

    $(performanceIframe).on("load", function () {
        showStatus("Performance target iframe loaded.", "success");
    });

    renderPerformanceChart();
    renderPerformanceSnapshots();
    updateMemoryReadout();
    startFpsMonitor();
    bindPerformanceEvents();

    window.addEventListener("beforeunload", stopFpsMonitor);
});