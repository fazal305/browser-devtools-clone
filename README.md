# Browser DevTools Clone

A browser-based recreation of core browser developer tools — DOM inspector,
CSS inspector, console, network viewer, and performance monitor — all
operating on a real, live, editable target page rendered in an iframe.

## Live Links

- GitHub Repository: [fazal305/browser-devtools-clone](https://github.com/fazal305/browser-devtools-clone)
- Live Demo: [https://fazal305.github.io/browser-devtools-clone/](https://fazal305.github.io/browser-devtools-clone/)

## Overview

Browser DevTools Clone is a professional multi-page frontend application that recreates the core workflow of browser developer tools. Instead of using static mock data, every panel works against the same live target page stored in localStorage and rendered inside an iframe.

The app demonstrates DOM traversal, live element editing, computed style inspection, sandboxed console evaluation, network request interception, FPS measurement, persistent workspace state, and a polished enterprise-style developer interface.

## Pages

- Dashboard: overview, target preview, workspace stats, target HTML editor, sample loader, and quick panel links
- DOM Inspector: recursive DOM tree, element selection, attribute editing, text editing, child creation, duplication, deletion, breadcrumb navigation, and persistence
- CSS Inspector: computed styles, box model diagram, inline style editor, class editor, matched style rules, and shared target selection
- Console: JavaScript evaluation inside the iframe, console output capture, command history, log filtering, and persisted history
- Network Viewer: fetch/XMLHttpRequest interception, request table, filtering, waterfall timing, request detail view, and persisted network log
- Performance Monitor: FPS counter, memory readout, stress test, Chart.js timeline recording, saved snapshots, and JSON export
- Settings: branding, theme controls, compact sidebar, console font size, workspace export/import, and reset tools

## Features

- Multi-page browser application with normal HTML navigation
- Shared live target iframe rendered from `workspace.targetHtml`
- localStorage workspace persistence across every page
- Recursive DOM tree built from `iframe.contentDocument`
- Real element selection and visual highlighting in the iframe
- Attribute, text content, child element, duplicate, and delete tools
- Real `getComputedStyle()` inspection
- Box model values for margin, border, padding, and content
- Live inline CSS editing through `element.style`
- Class list editing through `classList`
- Matched CSS rules from target page `<style>` blocks
- Console command execution inside `iframe.contentWindow`
- Captured `console.log`, `console.info`, `console.warn`, and `console.error`
- Command history with Up/Down navigation
- Network interception for iframe `fetch` and `XMLHttpRequest`
- Request filtering by type and status range
- Waterfall bars based on real request duration
- Real FPS monitoring through `requestAnimationFrame`
- Memory readout using `performance.memory` where supported
- Timed stress test using `performance.now()`
- Chart.js FPS timeline recording
- Workspace JSON export/import
- Dark mode and compact sidebar settings
- Responsive dark developer-tool interface

## Technologies Used

- HTML5
- CSS3
- Bootstrap 5
- jQuery
- Vanilla JavaScript
- Chart.js
- LocalStorage
- iframe / contentDocument APIs
- performance API
- Blob API
- Clipboard API

## Learning Outcomes

- Build a no-build multi-page frontend architecture
- Share state across pages with a persistent localStorage workspace model
- Render and inspect a live iframe document
- Traverse real DOM nodes and serialize edited HTML
- Resolve stable element paths across page modules
- Inspect computed styles and matched CSS rules
- Execute JavaScript in an isolated iframe runtime
- Override iframe console methods for log capture
- Hook browser request APIs inside an iframe context
- Record and visualize runtime performance metrics
- Design a polished enterprise developer-tool UI with shared and module-specific styles

## Architecture Notes

- Multi-page frontend architecture: each major module has its own HTML file, JavaScript file, and CSS file. Navigation uses normal links, so the app works by opening `index.html` directly.
- Shared live target iframe pattern across all panels: every panel renders the same `workspace.targetHtml` value into an iframe through `srcdoc`, creating one consistent inspectable target.
- Shared JavaScript utilities: reusable state, iframe, DOM path, serialization, formatting, theme, sidebar, download, and clipboard helpers live in `js/shared.js`.
- Shared CSS plus page-specific CSS: global shell layout, tokens, navigation, panels, iframe styling, and reusable component styles live in `styles.css`; each page adds its own module stylesheet.
- localStorage workspace model: the app stores settings, target HTML, selected element path, console history, network log, performance snapshots, and activity log in one workspace object.
- Real DOM tree traversal and live editing: the DOM Inspector walks `iframe.contentDocument`, selects actual elements, edits attributes/text, adds children, duplicates nodes, deletes nodes, and serializes changes back to localStorage.
- Real computed style inspection: the CSS Inspector reads `getComputedStyle()` from the iframe window, calculates box model values, edits inline styles, manages classes, and lists matching style rules.
- Sandboxed JS evaluation inside iframe context: the Console evaluates commands with `iframe.contentWindow.eval()` and captures real target console output by overriding iframe console methods.
- Real fetch/XHR interception for network capture: the Network Viewer wraps iframe `fetch` and `XMLHttpRequest` to persist method, URL, status, duration, size, headers, and response preview.
- Real FPS/performance measurement: the Performance Monitor uses `requestAnimationFrame`, `performance.now()`, optional `performance.memory`, and Chart.js to record timeline data.
- No-build browser architecture: the project uses plain HTML, CSS, Bootstrap CDN, jQuery CDN, and Chart.js CDN only. No frameworks, bundlers, package managers, or build tools are required.

## Folder Structure

```text
browser-devtools-clone/
  index.html
  dom-inspector.html
  css-inspector.html
  console.html
  network.html
  performance.html
  settings.html

  styles.css

  css/
    dashboard.css
    dom-inspector.css
    css-inspector.css
    console.css
    network.css
    performance.css
    settings.css

  js/
    shared.js
    dashboard.js
    dom-inspector.js
    css-inspector.js
    console.js
    network.js
    performance.js
    settings.js

  README.md
  LICENSE
  .gitignore
```

How To Run Locally
git clone https://github.com/fazal305/browser-devtools-clone.git
cd browser-devtools-clone
Open index.html directly in your browser.
No installation or build step is required.
How To Use
Open index.html to load the Dashboard.
Use the target preview to confirm the default iframe document is rendered.
Load the sample target page or edit the target HTML from the Dashboard.
Open the DOM Inspector to select, edit, add, duplicate, delete, and save real DOM elements.
Open the CSS Inspector to inspect computed styles, box model values, inline styles, classes, and matched rules.
Open the Console to run JavaScript inside the iframe runtime.
Open the Network Viewer to simulate or capture iframe requests.
Open the Performance Monitor to track FPS and save recording snapshots.
Open Settings to change branding, theme, sidebar mode, console font size, and import/export workspace data.
Sample Workflow
Load or edit the target page from the Dashboard.
Inspect an element in the DOM Inspector and change its text or attributes.
Save the DOM changes back into the shared target page.
Open the CSS Inspector and adjust that element with an inline style or class.
Run a command in the Console, such as document.querySelector("h1").textContent.
Trigger a request in the Network Viewer with the simulated fetch button and inspect the captured response.
Record a performance session in the Performance Monitor and save the snapshot.
Export the full workspace JSON from Settings.
