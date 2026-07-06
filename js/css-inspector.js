let cssIframe = null;
let currentCssPath = "";

const computedStyleNames = [
    "display",
    "position",
    "box-sizing",
    "width",
    "height",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "color",
    "background-color",
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "flex-direction",
    "justify-content",
    "align-items",
    "gap"
];

function getCssDocument() {
    return getIframeDocument(cssIframe);
}

function getCssSelectedElement() {
    return resolveElementByPath(getCssDocument(), currentCssPath);
}

function renderCssDomTree() {
    const doc = getCssDocument();

    if (!doc || !doc.documentElement) {
        $("#cssDomTree").html(renderEmptyState("Target document is not ready."));
        return;
    }

    $("#cssDomTree").html(buildDomTree(doc.documentElement));

    if (currentCssPath) {
        $(`#cssDomTree .dom-node[data-path="${CSS.escape(currentCssPath)}"]`).addClass("selected");
    }

    filterCssDomTree($("#cssDomSearch").val());
}

function selectCssNode(path) {
    const workspace = loadWorkspace();
    const element = resolveElementByPath(getCssDocument(), path);

    if (!element) {
        showStatus("Selected element no longer exists.", "warning");
        return;
    }

    currentCssPath = path;
    workspace.selectedElementPath = path;
    saveWorkspace(workspace);

    $("#cssDomTree .dom-node").removeClass("selected");
    $(`#cssDomTree .dom-node[data-path="${CSS.escape(path)}"]`).addClass("selected");

    highlightElementOverlay(cssIframe, element);
    $("#cssSelectedPath").text(path);
    $("#cssSelectedBadge").text(`<${element.tagName.toLowerCase()}>`);

    renderComputedStyles(path);
    renderBoxModel(path);
    renderInlineStyles(path);
    renderClassList(path);
    renderMatchedRules(path);
}

function renderComputedStyles(path) {
    const element = resolveElementByPath(getCssDocument(), path);

    if (!element) {
        $("#computedStyles").html(renderEmptyState("Select an element to inspect computed styles."));
        return;
    }

    const styles = cssIframe.contentWindow.getComputedStyle(element);

    $("#computedStyles").html(computedStyleNames.map((name) => `
    <div class="computed-row">
      <span class="property">${escapeHtml(name)}</span>
      <span class="value">${escapeHtml(styles.getPropertyValue(name))}</span>
    </div>
  `).join(""));
}

function renderBoxModel(path) {
    const element = resolveElementByPath(getCssDocument(), path);

    if (!element) {
        $("#boxModel").html(renderEmptyState("Select an element to view box model."));
        return;
    }

    const styles = cssIframe.contentWindow.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    const margin = `${styles.marginTop} ${styles.marginRight} ${styles.marginBottom} ${styles.marginLeft}`;
    const border = `${styles.borderTopWidth} ${styles.borderRightWidth} ${styles.borderBottomWidth} ${styles.borderLeftWidth}`;
    const padding = `${styles.paddingTop} ${styles.paddingRight} ${styles.paddingBottom} ${styles.paddingLeft}`;
    const content = `${Math.round(rect.width)}px × ${Math.round(rect.height)}px`;

    $("#boxModel").html(`
    <div class="box-layer">
      margin ${escapeHtml(margin)}
      <div class="box-layer border-layer">
        border ${escapeHtml(border)}
        <div class="box-layer padding-layer">
          padding ${escapeHtml(padding)}
          <div class="box-layer content-layer">
            content ${escapeHtml(content)}
          </div>
        </div>
      </div>
    </div>
  `);
}

function renderInlineStyles(path) {
    const element = resolveElementByPath(getCssDocument(), path);

    if (!element) {
        $("#inlineStyleList").html(renderEmptyState("Select an element to edit inline styles."));
        return;
    }

    const styles = Array.from(element.style).map((name) => ({
        name,
        value: element.style.getPropertyValue(name)
    }));

    if (!styles.length) {
        $("#inlineStyleList").html(renderEmptyState("No inline styles on this element."));
        return;
    }

    $("#inlineStyleList").html(styles.map((item) => `
    <div class="style-row" data-style-name="${escapeHtml(item.name)}">
      <input class="form-control form-control-sm style-name code-font" value="${escapeHtml(item.name)}">
      <input class="form-control form-control-sm style-value code-font" value="${escapeHtml(item.value)}">
      <button class="btn btn-outline-danger btn-sm remove-style" type="button">Remove</button>
    </div>
  `).join(""));
}

function addInlineStyleProperty(path, name, value) {
    const element = resolveElementByPath(getCssDocument(), path);
    const cleanName = String(name || "").trim();

    if (!element || !cleanName) {
        showStatus("Select an element and enter a CSS property.", "warning");
        return;
    }

    element.style.setProperty(cleanName, value);
    renderComputedStyles(path);
    renderBoxModel(path);
    renderInlineStyles(path);
    renderMatchedRules(path);

    addActivityLog("CSS Inspector", "Edited inline style", `Set ${cleanName}: ${value}`);
    showStatus("Inline style applied.", "success");
}

function removeInlineStyleProperty(path, name) {
    const element = resolveElementByPath(getCssDocument(), path);

    if (!element) return;

    element.style.removeProperty(name);
    renderComputedStyles(path);
    renderBoxModel(path);
    renderInlineStyles(path);

    addActivityLog("CSS Inspector", "Removed inline style", `Removed ${name}`);
    showStatus("Inline style removed.", "success");
}

function toggleClass(path, className) {
    const element = resolveElementByPath(getCssDocument(), path);
    const cleanClass = slugify(className);

    if (!element || !cleanClass) {
        showStatus("Select an element and enter a class name.", "warning");
        return;
    }

    if (element.classList.contains(cleanClass)) {
        element.classList.remove(cleanClass);
        addActivityLog("CSS Inspector", "Removed class", `Removed .${cleanClass}`);
    } else {
        element.classList.add(cleanClass);
        addActivityLog("CSS Inspector", "Added class", `Added .${cleanClass}`);
    }

    renderCssDomTree();
    selectCssNode(getElementPath(element));
    showStatus("Class list updated.", "success");
}

function renderClassList(path) {
    const element = resolveElementByPath(getCssDocument(), path);

    if (!element) {
        $("#classList").html(renderEmptyState("Select an element to edit classes."));
        return;
    }

    const classes = Array.from(element.classList || []);

    if (!classes.length) {
        $("#classList").html(renderEmptyState("No classes on this element."));
        return;
    }

    $("#classList").html(classes.map((className) => `
    <span class="class-pill">
      .${escapeHtml(className)}
      <button class="btn btn-sm btn-outline-danger py-0 remove-class" data-class="${escapeHtml(className)}" type="button">×</button>
    </span>
  `).join(""));
}

function renderMatchedRules(path) {
    const doc = getCssDocument();
    const element = resolveElementByPath(doc, path);

    if (!doc || !element) {
        $("#matchedRules").html(renderEmptyState("Select an element to inspect matched rules."));
        return;
    }

    const matches = [];

    Array.from(doc.styleSheets).forEach((sheet) => {
        let rules = [];

        try {
            rules = Array.from(sheet.cssRules || []);
        } catch (error) {
            return;
        }

        rules.forEach((rule) => {
            if (!rule.selectorText || !rule.style) return;

            try {
                if (element.matches(rule.selectorText)) {
                    matches.push({
                        selector: rule.selectorText,
                        body: rule.style.cssText
                    });
                }
            } catch (error) {
                // Some selectors can be browser-specific or unsupported by matches().
            }
        });
    });

    if (!matches.length) {
        $("#matchedRules").html(renderEmptyState("No style block rules match this element."));
        return;
    }

    $("#matchedRules").html(matches.map((rule) => `
    <div class="rule-card">
      <div class="rule-selector">${escapeHtml(rule.selector)}</div>
      <div class="rule-body">${escapeHtml(rule.body)}</div>
    </div>
  `).join(""));
}

function filterCssDomTree(query) {
    const normalized = String(query || "").trim().toLowerCase();

    if (!normalized) {
        $("#cssDomTree .dom-branch").show();
        return;
    }

    $("#cssDomTree .dom-branch").each(function () {
        const text = $(this).children(".dom-node").first().text().toLowerCase();
        const isMatch = text.includes(normalized);
        $(this).toggle(isMatch);

        if (isMatch) {
            $(this).parents(".dom-branch").show();
        }
    });
}

function saveCssTargetHtml() {
    const workspace = loadWorkspace();
    workspace.targetHtml = serializeIframeToTargetHtml(cssIframe);
    workspace.selectedElementPath = currentCssPath;
    saveWorkspace(workspace);

    addActivityLog("CSS Inspector", "Saved target page", "Persisted CSS edits to workspace.targetHtml");
    showStatus("CSS edits saved to shared target HTML.", "success");
}

function bindCssInspectorEvents() {
    $("#cssDomTree").on("click", ".dom-node", function () {
        selectCssNode($(this).data("path"));
    });

    $("#cssDomSearch").on("input", function () {
        filterCssDomTree($(this).val());
    });

    $("#addStyleBtn").on("click", function () {
        addInlineStyleProperty(currentCssPath, $("#newStyleName").val(), $("#newStyleValue").val());
    });

    $("#inlineStyleList").on("change", ".style-name, .style-value", function () {
        const row = $(this).closest(".style-row");
        const oldName = row.data("style-name");
        const newName = row.find(".style-name").val().trim();
        const value = row.find(".style-value").val();
        const element = getCssSelectedElement();

        if (!element || !newName) return;

        if (oldName !== newName) {
            element.style.removeProperty(oldName);
        }

        addInlineStyleProperty(currentCssPath, newName, value);
    });

    $("#inlineStyleList").on("click", ".remove-style", function () {
        const name = $(this).closest(".style-row").data("style-name");
        removeInlineStyleProperty(currentCssPath, name);
    });

    $("#addClassBtn").on("click", function () {
        toggleClass(currentCssPath, $("#newClassName").val());
        $("#newClassName").val("");
    });

    $("#classList").on("click", ".remove-class", function () {
        toggleClass(currentCssPath, $(this).data("class"));
    });

    $("#saveCssTargetBtn").on("click", saveCssTargetHtml);
}

$(function () {
    $("#sidebarRoot").replaceWith(renderSidebar("css"));
    applyThemeSettings();
    setActiveNav();

    cssIframe = renderTargetIframe("cssTargetMount");

    $(cssIframe).on("load", function () {
        const workspace = loadWorkspace();
        const doc = getCssDocument();

        currentCssPath = workspace.selectedElementPath || getElementPath(doc.body || doc.documentElement);

        renderCssDomTree();

        if (!resolveElementByPath(doc, currentCssPath)) {
            currentCssPath = getElementPath(doc.body || doc.documentElement);
        }

        selectCssNode(currentCssPath);
        showStatus("CSS Inspector connected to live iframe.", "success");
    });

    bindCssInspectorEvents();
});