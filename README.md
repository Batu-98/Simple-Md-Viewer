# 📄 Simple Markdown Viewer & PDF

A modern, fast, and privacy-first local **Markdown Viewer, Live Editor, and Pixel-Perfect A4 PDF Converter**.

Runs completely locally with **zero external dependencies** (`npm install` is not required).

---

## ⚡ Quick Start

### Option 1: Double-Click Launcher (Windows)
Double-click **`start.bat`**.
* The lightweight local server starts instantly.
* Your default web browser opens automatically at `http://127.0.0.1:3000`.

### Option 2: Terminal / Command Line
```bash
node server.js
# or
npm start
```

### Option 3: Direct Static File (No Server Needed)
Double-click **`index.html`** to open and use the application directly in any modern browser (Chrome, Edge, Firefox, Brave).

---

## 🎯 Set as Windows Default App for `.md` Files

You can make all Markdown files on your computer open directly in this viewer with a single click:

### Automatic One-Click Setup
Double-click **`set-default.bat`**:
* Registers `.md` and `.markdown` file associations at user level (**no administrator privileges required**).
* Associates files with the official high-resolution Markdown icon (`markdown.ico`).
* Adds **"Open with Markdown Viewer"** to the Windows File Explorer right-click context menu.
* Launches via **`mdviewer.exe`** — a silent native launcher (no command prompt window pops up).

> [!NOTE]
> To revert file associations at any time, run **`remove-default.bat`**.

---

## 🌟 Key Features

### 1. 📂 File & Directory Management
* **Open File (`Ctrl + O`):** Pick and view any `.md` or `.txt` file on your computer.
* **Open Folder:** Select a notes directory to view a searchable sidebar list of all Markdown files with instant one-click switching.
* **Drag & Drop:** Drop any Markdown file into the browser window to open it immediately.
* **Smart URL Parameter (`?file=...`):** Double-clicking files across your computer opens them instantly in browser tabs.

### 2. 🖨️ Pixel-Perfect Vector PDF Export (`Ctrl + P`)
* Uses browser print engine (`@media print`) for **100% vector, crystal-clear** PDF rendering.
* **Optimized A4 Geometry:** Clean margins, font scales, and line heights tuned specifically for international A4 dimensions.
* **Orphan & Break Prevention:** Tables, code blocks, callouts, and diagrams automatically avoid awkward page splits (`break-inside: avoid`).
* **Manual Page Breaks:** Add `<!-- pagebreak -->` anywhere in your Markdown to force a clean break onto a new page.
* **High-Contrast Code Styling:** Code blocks render with a subtle light background and high-contrast syntax highlighting, ensuring full visibility whether browser "Background graphics" is enabled or disabled.

### 3. 🎨 Layouts & Themes
* **Continuous Reader View (Default):** Distraction-free, responsive reading experience.
* **Multi-Sheet A4 Mode:** Simulates real physical sheets of paper (Page 1, Page 2, Page 3...) with margins, drop shadows, and page footers (`Page X of Y`).
* **Split View & Live Editor:** Edit markdown on the left pane and see real-time updates on the right.
* **Theme Support:** Clean Light (GitHub style), Dark (GitHub Dark / Dracula), and Warm Sepia.

### 4. 🚀 Rich Content Support
* **Mermaid.js Diagrams:** Flowcharts (`flowchart`), sequence diagrams (`sequenceDiagram`), and Gantt charts.
* **KaTeX Mathematics:** Inline equations (`$E=mc^2$`) and display formulas (`$$\int e^x dx$$`).
* **Syntax Highlighting:** Highlight.js with language badges and one-click copy buttons.
* **GitHub Callouts:** Native support for `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, and `[!CAUTION]`.
* **Automatic Outline (TOC):** Hierarchical table of contents generated from document headings with smooth jump navigation.
* **Live Statistics:** Real-time word count, character count, estimated reading time, and A4 page estimates.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + O` / `Cmd + O` | Open file picker dialog |
| `Ctrl + P` / `Cmd + P` | Open Print / Save as PDF dialog |
| `Ctrl + S` / `Cmd + S` | Save file changes |

---

## 💡 PDF Export Tips

When clicking **"Save PDF"** (or pressing `Ctrl + P`):
1. **Destination:** Choose **"Save as PDF"**.
2. **Layout:** Select **Portrait**.
3. **Paper Size:** Ensure **A4** is selected.
4. **Options:** Check **"Background graphics"** for colored callout boxes and table stripes.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
