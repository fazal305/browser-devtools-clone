let domIframe = null;
let currentDomPath = "";

function getDomDocument() {
    return getIframeDocument(domIframe);
}

function getSelectedElement() {
    const doc = getDomDocument();
    return resolveElementByPath(doc, currentDomPath);
}

function renderDomTree() {
    const doc = getDomDocument();

    if (!doc || !doc.documentElement) {
        $("#domTree").html(renderEmptyState("The target document is not ready yet."));
        return;
    }

    $("#domTree").html(buildDomTree(doc.documentElement));

    if (currentDomPath) {
        $(`.dom-node[data-path="${CSS.escape(currentDomPath)}"]`).addClass("selected");
    }

    filterDomTree($("#domSearchInput").val() || "");
}

function selectDomNode(path) {
    const workspace = loadWorkspace();
    const doc = getDomDocument();
    const element = resolveElementByPath(doc, path);

    if (!element) {
        showStatus("Selected element no longer exists.", "warning");
        return;
    }

    currentDomPath = path;
    workspace.selectedElementPath = path;
    saveWorkspace(workspace);

    $(".dom-node").removeClass("selected");
    $(`.dom-node[data-path="${CSS.escape(path)}"]`).addClass("selected");

    highlightElementOverlay(domIframe, element);
    renderSelectedElement(element);
    renderBreadcrumb(path);
}

function renderSelectedElement(element) {
    if (!element) {
        $("#selectedBadge").text("none");
        $("#selectedSummary").html(renderEmptyState("Select an element from the DOM tree."));
        $("#textContentEditor").val("");
        $("#attributesPanel").html("");
        return;
    }

    const tag = element.tagName.toLowerCase();
    $("#selectedBadge").text(`<${tag}>`);
    $("#selectedSummary").html(`
    <div><span>Path:</span> ${escapeHtml(currentDomPath)}</div>
    <div><span>Tag:</span> &lt;${escapeHtml(tag)}&gt;</div>
    <div><span>Children:</span> ${element.children.length}</div>
  `);

    $("#textContentEditor").val(element.childElementCount ? element.innerText : element.textContent);
    renderAttributes(element);
}

function renderAttributes(element) {
    const attrs = Array.from(element.attributes || []);

    if (!attrs.length) {
        $("#attributesPanel").html(renderEmptyState("This element has no attributes."));
        return;
    }

    $("#attributesPanel").html(attrs.map((attr) => `
    <div class="attribute-row" data-attr="${escapeHtml(attr.name)}">
      <input class="form-control form-control-sm attr-name code-font" value="${escapeHtml(attr.name)}" aria-label="Attribute name">
      <input class="form-control form-control-sm attr-value code-font" value="${escapeHtml(attr.value)}" aria-label="Attribute value">
      <button class="btn btn-outline-danger btn-sm remove-attr" type="button">Remove</button>
    </div>
  `).join(""));
}

function editAttribute(path, name, value) {
    const doc = getDomDocument();
    const element = resolveElementByPath(doc, path);

    if (!element || !name.trim()) return;

    element.setAttribute(name.trim(), value);
    renderDomTree();
    renderSelectedElement(element);
    addActivityLog("DOM Inspector", "Edited attribute", `Set ${name} on <${element.tagName.toLowerCase()}>`);
}

function editTextContent(path, value) {
    const doc = getDomDocument();
    const element = resolveElementByPath(doc, path);

    if (!element) return;

    element.textContent = value;
    renderDomTree();
    renderSelectedElement(element);
    addActivityLog("DOM Inspector", "Edited element", `Changed text content of <${element.tagName.toLowerCase()}>`);
    showStatus("Text content updated.", "success");
}

function addChildElement(path, tagName) {
    const doc = getDomDocument();
    const element = resolveElementByPath(doc, path);
    const cleanTag = slugify(tagName).replaceAll("-", "") || "div";

    if (!element) return;

    const child = doc.createElement(cleanTag);
    child.textContent = `New ${cleanTag} element`;
    element.appendChild(child);

    currentDomPath = getElementPath(child);
    renderDomTree();
    selectDomNode(currentDomPath);
    addActivityLog("DOM Inspector", "Added child element", `Added <${cleanTag}> under <${element.tagName.toLowerCase()}>`);
    showStatus(`Added <${cleanTag}> child element.`, "success");
}

function duplicateElement(path) {
    const doc = getDomDocument();
    const element = resolveElementByPath(doc, path);

    if (!element || !element.parentElement || element === doc.documentElement) {
        showStatus("This element cannot be duplicated.", "warning");
        return;
    }

    const clone = element.cloneNode(true);
    element.after(clone);

    currentDomPath = getElementPath(clone);
    renderDomTree();
    selectDomNode(currentDomPath);
    addActivityLog("DOM Inspector", "Duplicated element", `Duplicated <${element.tagName.toLowerCase()}>`);
    showStatus("Element duplicated.", "success");
}

function deleteElement(path) {
    const doc = getDomDocument();
    const element = resolveElementByPath(doc, path);

    if (!element || element === doc.documentElement || element === doc.body || element === doc.head) {
        showStatus("This element cannot be deleted.", "warning");
        return;
    }

    const parent = element.parentElement;
    const parentPath = getElementPath(parent);
    const tag = element.tagName.toLowerCase();

    element.remove();
    currentDomPath = parentPath;

    renderDomTree();
    selectDomNode(parentPath);
    addActivityLog("DOM Inspector", "Deleted element", `Deleted <${tag}>`);
    showStatus(`Deleted <${tag}>.`, "success");
}

function filterDomTree(query) {
    const normalized = String(query || "").trim().toLowerCase();

    if (!normalized) {
        $(".dom-branch").show();
        return;
    }

    $(".dom-branch").each(function () {
        const text = $(this).children(".dom-node").first().text().toLowerCase();
        const isMatch = text.includes(normalized);
        $(this).toggle(isMatch);

        if (isMatch) {
            $(this).parents(".dom-branch").show();
        }
    });
}

function renderBreadcrumb(path) {
    const doc = getDomDocument();
    const parts = String(path || "").split(">").filter(Boolean);
    let progressive = "";

    if (!parts.length || !doc) {
        $("#domBreadcrumb").html("<li class='text-muted'>No element selected</li>");
        return;
    }

    $("#domBreadcrumb").html(parts.map((part, index) => {
        progressive = index === 0 ? part : `${progressive}>${part}`;
        const element = resolveElementByPath(doc, progressive);
        const label = element ? element.tagName.toLowerCase() : part.split(":")[0];

        return `
      <li>
        <button type="button" class="px-2 py-1 breadcrumb-node" data-path="${escapeHtml(progressive)}">
          ${escapeHtml(label)}
        </button>
      </li>
    `;
    }).join(""));
}

function saveChangesToTargetPage() {
    if (!domIframe) return;

    const workspace = loadWorkspace();
    workspace.targetHtml = serializeIframeToTargetHtml(domIframe);
    workspace.selectedElementPath = currentDomPath;
    saveWorkspace(workspace);

    addActivityLog("DOM Inspector", "Saved target page", "Serialized iframe document back into workspace.targetHtml");
    showStatus("DOM changes saved to the shared target page.", "success");
}

function addBlankAttribute() {
    const element = getSelectedElement();

    if (!element) {
        showStatus("Select an element before adding an attribute.", "warning");
        return;
    }

    let index = 1;
    let name = "data-devtools";
    while (element.hasAttribute(name)) {
        index += 1;
        name = `data-devtools-${index}`;
    }

    element.setAttribute(name, "true");
    renderSelectedElement(element);
    renderDomTree();
    showStatus("Attribute added. Edit its name or value below.", "success");
}

function bindDomInspectorEvents() {
    $("#domTree").on("click", ".dom-node", function () {
        selectDomNode($(this).data("path"));
    });

    $("#domSearchInput").on("input", function () {
        filterDomTree($(this).val());
    });

    $("#clearSearchBtn").on("click", function () {
        $("#domSearchInput").val("");
        filterDomTree("");
    });

    $("#attributesPanel").on("change", ".attr-name, .attr-value", function () {
        const row = $(this).closest(".attribute-row");
        const oldName = row.data("attr");
        const newName = row.find(".attr-name").val().trim();
        const value = row.find(".attr-value").val();
        const element = getSelectedElement();

        if (!element || !newName) return;

        if (oldName !== newName) {
            element.removeAttribute(oldName);
        }

        editAttribute(currentDomPath, newName, value);
    });

    $("#attributesPanel").on("click", ".remove-attr", function () {
        const row = $(this).closest(".attribute-row");
        const name = row.data("attr");
        const element = getSelectedElement();

        if (!element) return;

        element.removeAttribute(name);
        renderSelectedElement(element);
        renderDomTree();
        addActivityLog("DOM Inspector", "Removed attribute", `Removed ${name} from <${element.tagName.toLowerCase()}>`);
        showStatus("Attribute removed.", "success");
    });

    $("#addAttributeBtn").on("click", addBlankAttribute);

    $("#saveTextBtn").on("click", function () {
        editTextContent(currentDomPath, $("#textContentEditor").val());
    });

    $("#addChildBtn").on("click", function () {
        addChildElement(currentDomPath, $("#newChildTag").val());
    });

    $("#duplicateBtn").on("click", function () {
        duplicateElement(currentDomPath);
    });

    $("#deleteBtn").on("click", function () {
        deleteElement(currentDomPath);
    });

    $("#domBreadcrumb").on("click", ".breadcrumb-node", function () {
        selectDomNode($(this).data("path"));
    });

    $("#saveTargetBtn").on("click", saveChangesToTargetPage);
}

$(function () {
    $("#sidebarRoot").replaceWith(renderSidebar("dom"));
    applyThemeSettings();
    setActiveNav();

    domIframe = renderTargetIframe("targetFrameMount");

    $(domIframe).on("load", function () {
        const workspace = loadWorkspace();
        const doc = getDomDocument();
        currentDomPath = workspace.selectedElementPath || getElementPath(doc.body || doc.documentElement);

        renderDomTree();

        if (!resolveElementByPath(doc, currentDomPath)) {
            currentDomPath = getElementPath(doc.body || doc.documentElement);
        }

        selectDomNode(currentDomPath);
        showStatus("DOM tree loaded from live iframe.", "success");
    });

    bindDomInspectorEvents();
});