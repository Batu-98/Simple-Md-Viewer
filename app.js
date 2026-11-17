/**
 * Simple Markdown Viewer & PDF
 * Fast, local-first Markdown reader, editor, and vector PDF converter.
 */

// Global Application State
const state = {
  currentContent: '',
  currentFileName: 'sample-document.md',
  currentFilePath: 'sample-document.md',
  viewMode: 'preview', // 'preview', 'split', 'editor'
  isA4Mode: false,
  currentTheme: localStorage.getItem('mdviewer_theme') || 'light',
  files: [],
  sidebarOpen: true
};

// DOM Elements
const el = {
  markdownInput: document.getElementById('markdown-input'),
  markdownOutput: document.getElementById('markdown-output'),
  previewWrapper: document.getElementById('preview-wrapper'),
  previewPane: document.getElementById('preview-pane'),
  editorPane: document.getElementById('editor-pane'),
  currentFilename: document.getElementById('current-filename'),
  
  // Action Buttons
  btnOpenFile: document.getElementById('btn-open-file'),
  btnOpenFolder: document.getElementById('btn-open-folder'),
  btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
  btnToggleA4: document.getElementById('btn-toggle-a4'),
  a4BtnText: document.getElementById('a4-btn-text'),
  btnToggleTheme: document.getElementById('btn-toggle-theme'),
  btnPrintPdf: document.getElementById('btn-print-pdf'),
  btnSaveLocal: document.getElementById('btn-save-local'),
  
  // View Modes
  viewModePreview: document.getElementById('view-mode-preview'),
  viewModeSplit: document.getElementById('view-mode-split'),
  viewModeEditor: document.getElementById('view-mode-editor'),
  
  // File Inputs
  fileInput: document.getElementById('file-input'),
  folderInput: document.getElementById('folder-input'),
  
  // Sidebar Elements
  appSidebar: document.getElementById('app-sidebar'),
  tabFilesBtn: document.getElementById('tab-files-btn'),
  tabTocBtn: document.getElementById('tab-toc-btn'),
  tabContentFiles: document.getElementById('tab-content-files'),
  tabContentToc: document.getElementById('tab-content-toc'),
  fileSearchInput: document.getElementById('file-search-input'),
  sidebarFileList: document.getElementById('sidebar-file-list'),
  tocContainer: document.getElementById('toc-container'),
  
  // Status Bar
  statWords: document.getElementById('stat-words'),
  statChars: document.getElementById('stat-chars'),
  statReadTime: document.getElementById('stat-read-time'),
  statPages: document.getElementById('stat-pages'),
  
  // Drag & Drop
  dropOverlay: document.getElementById('drop-overlay')
};

// Initialize Mermaid.js
if (window.mermaid) {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif'
  });
}

// -----------------------------------------------------------------------------
// Markdown Processing (Marked + KaTeX + Highlight.js + Callouts)
// -----------------------------------------------------------------------------

function renderMarkdown(mdText) {
  if (!mdText) {
    el.previewWrapper.innerHTML = '<article class="markdown-body" id="markdown-output"><p style="color: var(--text-muted); font-style: italic;">No content to display.</p></article>';
    el.markdownOutput = document.getElementById('markdown-output');
    updateStats('');
    generateTOC();
    return;
  }

  // 1. Protect KaTeX math formulas with placeholder tokens before marked parsing
  const mathBlocks = [];
  const mathInlines = [];

  // Display math ($$...$$)
  let processed = mdText.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    const id = mathBlocks.length;
    mathBlocks.push(formula.trim());
    return `%%KATEX_BLOCK_${id}%%`;
  });

  // Inline math ($...$)
  processed = processed.replace(/(?<!\\)\$([^\$\n]+?)\$/g, (match, formula) => {
    const id = mathInlines.length;
    mathInlines.push(formula.trim());
    return `%%KATEX_INLINE_${id}%%`;
  });

  // Page break comments
  processed = processed.replace(/<!--\s*pagebreak\s*-->/gi, '<div class="page-break"></div>');

  // 2. Parse Markdown to HTML with Marked.js
  marked.setOptions({
    gfm: true,
    breaks: true,
    highlight: function(code, lang) {
      if (lang === 'mermaid') {
        return `<div class="mermaid">${code}</div>`;
      }
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (err) {}
      }
      return hljs.highlightAuto(code).value;
    }
  });

  let html = marked.parse(processed);

  // 3. Replace KaTeX tokens with rendered HTML
  html = html.replace(/%%KATEX_BLOCK_(\d+)%%/g, (match, id) => {
    const formula = mathBlocks[Number(id)];
    try {
      return `<div class="katex-display">${katex.renderToString(formula, { displayMode: true, throwOnError: false })}</div>`;
    } catch (e) {
      return `<pre class="katex-error">${formula}</pre>`;
    }
  });

  html = html.replace(/%%KATEX_INLINE_(\d+)%%/g, (match, id) => {
    const formula = mathInlines[Number(id)];
    try {
      return katex.renderToString(formula, { displayMode: false, throwOnError: false });
    } catch (e) {
      return `<code>${formula}</code>`;
    }
  });

  // 4. Transform GitHub-style Alert Callouts
  html = html.replace(/<blockquote>\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*<br\s*\/?>)?([\s\S]*?)<\/p>\s*<\/blockquote>/gi, (match, type, content) => {
    const lowerType = type.toLowerCase();
    const titles = {
      note: 'Note',
      tip: 'Tip',
      important: 'Important',
      warning: 'Warning',
      caution: 'Caution'
    };
    const title = titles[lowerType] || type;
    return `
      <div class="callout callout-${lowerType}">
        <div class="callout-title">${title}</div>
        <p>${content.trim()}</p>
      </div>
    `;
  });

  // 5. Mount output article
  let outputArticle = document.getElementById('markdown-output');
  if (!outputArticle) {
    outputArticle = document.createElement('article');
    outputArticle.className = 'markdown-body';
    outputArticle.id = 'markdown-output';
  }
  outputArticle.innerHTML = html;
  el.markdownOutput = outputArticle;

  // 6. Enhance code blocks (Language badge + Copy button)
  enhanceCodeBlocks();

  // 7. Render Mermaid diagrams
  if (window.mermaid) {
    try {
      mermaid.run({
        querySelector: '.mermaid'
      });
    } catch (err) {
      console.warn('Mermaid render error:', err);
    }
  }

  // 8. Apply layout: Multi-Sheet A4 Mode or Continuous Reader View
  if (state.isA4Mode) {
    applyA4Pagination();
  } else {
    el.previewWrapper.innerHTML = '';
    el.previewWrapper.appendChild(outputArticle);
  }

  // 9. Update Document Stats and Outline (TOC)
  updateStats(mdText);
  generateTOC();
}

// Multi-Sheet A4 Pagination
function applyA4Pagination() {
  const outputArticle = el.markdownOutput;
  if (!outputArticle) return;

  const items = Array.from(outputArticle.children);
  if (items.length === 0) return;

  const PAGE_LIMIT = 900; // Target pixel height for A4 usable content
  const sheets = [];

  function createNewSheet(pageIndex) {
    const sheet = document.createElement('div');
    sheet.className = 'a4-sheet';
    sheet.dataset.page = pageIndex;

    const header = document.createElement('div');
    header.className = 'a4-sheet-header';
    header.innerHTML = `<span>${state.currentFileName || 'Document'}</span><span>A4 Print Preview</span>`;

    const content = document.createElement('div');
    content.className = 'a4-sheet-content markdown-body';

    const footer = document.createElement('div');
    footer.className = 'a4-sheet-footer';
    footer.textContent = `Page ${pageIndex}`;

    sheet.appendChild(header);
    sheet.appendChild(content);
    sheet.appendChild(footer);

    return { sheet, content, footer };
  }

  let current = createNewSheet(1);
  sheets.push(current);
  let currentHeight = 0;

  items.forEach((item) => {
    // Manual page break <!-- pagebreak -->
    if (item.classList.contains('page-break')) {
      if (current.content.children.length > 0) {
        current = createNewSheet(sheets.length + 1);
        sheets.push(current);
        currentHeight = 0;
      }
      return;
    }

    const h = item.offsetHeight || 36;

    // Check if adding this element exceeds the sheet height
    if (currentHeight > 0 && (currentHeight + h > PAGE_LIMIT)) {
      current = createNewSheet(sheets.length + 1);
      sheets.push(current);
      currentHeight = 0;
    }

    current.content.appendChild(item);
    currentHeight += h + 16;
  });

  // Update page numbers (Page X of Y)
  const total = sheets.length;
  sheets.forEach((s, idx) => {
    s.footer.textContent = `Page ${idx + 1} of ${total}`;
  });

  // Mount sheets into preview wrapper
  el.previewWrapper.innerHTML = '';
  sheets.forEach(s => el.previewWrapper.appendChild(s.sheet));

  el.statPages.textContent = `${total} Page${total > 1 ? 's' : ''} (A4)`;
}

// Enhance Code Blocks with Header & Copy Button
function enhanceCodeBlocks() {
  const preElements = el.markdownOutput.querySelectorAll('pre');
  preElements.forEach((pre) => {
    if (pre.querySelector('.mermaid') || pre.classList.contains('mermaid')) return;

    const code = pre.querySelector('code');
    if (!code) return;

    if (pre.parentElement.classList.contains('code-block-wrapper')) return;

    // Detect programming language
    let lang = 'Code';
    const classes = Array.from(code.classList);
    for (const c of classes) {
      if (c.startsWith('language-')) {
        lang = c.replace('language-', '').toUpperCase();
        break;
      }
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';

    const header = document.createElement('div');
    header.className = 'code-header';
    header.innerHTML = `
      <span>${lang}</span>
      <button class="copy-btn">Copy</button>
    `;

    const copyBtn = header.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(code.innerText).then(() => {
        copyBtn.textContent = 'Copied!';
        copyBtn.style.color = '#10b981';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
          copyBtn.style.color = '';
        }, 2000);
      });
    });

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });
}

// -----------------------------------------------------------------------------
// Outline / Table of Contents (TOC)
// -----------------------------------------------------------------------------

function generateTOC() {
  const headings = el.previewWrapper.querySelectorAll('h1, h2, h3, h4');
  el.tocContainer.innerHTML = '';

  if (headings.length === 0) {
    el.tocContainer.innerHTML = '<li style="color: var(--text-muted); font-size: 0.8rem; padding: 0.5rem;">No headings found.</li>';
    return;
  }

  headings.forEach((heading, index) => {
    if (!heading.id) {
      heading.id = 'heading-' + index + '-' + heading.innerText.toLowerCase().replace(/[^\w\u00C0-\u017F]+/g, '-');
    }

    const level = parseInt(heading.tagName.substring(1), 10);
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = `toc-item level-${level}`;
    a.href = `#${heading.id}`;
    a.textContent = heading.innerText;
    
    a.addEventListener('click', (e) => {
      e.preventDefault();
      heading.scrollIntoView({ behavior: 'smooth' });
    });

    li.appendChild(a);
    el.tocContainer.appendChild(li);
  });
}

// -----------------------------------------------------------------------------
// Document Statistics (Word count, Characters, Reading time)
// -----------------------------------------------------------------------------

function updateStats(text) {
  const clean = text.replace(/```[\s\S]*?```/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const words = clean.trim() ? clean.trim().split(/\s+/).filter(Boolean).length : 0;
  const chars = clean.length;
  const readTime = Math.max(1, Math.ceil(words / 200));
  const pages = Math.max(1, Math.ceil(words / 450));

  el.statWords.textContent = `${words.toLocaleString()} words`;
  el.statChars.textContent = `${chars.toLocaleString()} characters`;
  el.statReadTime.textContent = `~${readTime} min read`;
  if (!state.isA4Mode) {
    el.statPages.textContent = `Estimated: ${pages} Page${pages > 1 ? 's' : ''} (A4)`;
  }
}

// -----------------------------------------------------------------------------
// View Modes & Layout
// -----------------------------------------------------------------------------

function setViewMode(mode) {
  state.viewMode = mode;
  el.viewModePreview.classList.remove('btn-active');
  el.viewModeSplit.classList.remove('btn-active');
  el.viewModeEditor.classList.remove('btn-active');

  if (mode === 'preview') {
    el.viewModePreview.classList.add('btn-active');
    el.editorPane.style.display = 'none';
    el.previewPane.style.display = 'flex';
  } else if (mode === 'split') {
    el.viewModeSplit.classList.add('btn-active');
    el.editorPane.style.display = 'flex';
    el.previewPane.style.display = 'flex';
  } else if (mode === 'editor') {
    el.viewModeEditor.classList.add('btn-active');
    el.editorPane.style.display = 'flex';
    el.previewPane.style.display = 'none';
  }
}

function toggleA4Mode() {
  state.isA4Mode = !state.isA4Mode;
  updateA4ModeButton();
  renderMarkdown(state.currentContent);
}

function updateA4ModeButton() {
  if (state.isA4Mode) {
    el.previewWrapper.classList.add('a4-active');
    el.previewPane.classList.add('a4-desk-bg');
    el.btnToggleA4.classList.add('btn-active');
    el.a4BtnText.textContent = 'A4 Mode: On';
  } else {
    el.previewWrapper.classList.remove('a4-active');
    el.previewPane.classList.remove('a4-desk-bg');
    el.btnToggleA4.classList.remove('btn-active');
    el.a4BtnText.textContent = 'A4 Mode';
  }
}

// -----------------------------------------------------------------------------
// Theme Management (Light / Dark / Sepia)
// -----------------------------------------------------------------------------

function setTheme(theme) {
  state.currentTheme = theme;
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('mdviewer_theme', theme);

  const hljsTheme = document.getElementById('highlight-theme');
  if (hljsTheme) {
    if (theme === 'dark') {
      hljsTheme.href = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css';
    } else {
      hljsTheme.href = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css';
    }
  }
}

function cycleTheme() {
  const themes = ['light', 'dark', 'sepia'];
  const next = themes[(themes.indexOf(state.currentTheme) + 1) % themes.length];
  setTheme(next);
}

// -----------------------------------------------------------------------------
// Vector PDF Print / Export
// -----------------------------------------------------------------------------

function printDocument() {
  const originalTitle = document.title;
  const cleanName = state.currentFileName.replace(/\.[^/.]+$/, '');
  document.title = cleanName;

  // Trigger native browser print dialog
  window.print();

  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

// -----------------------------------------------------------------------------
// File & Folder Handlers
// -----------------------------------------------------------------------------

function loadContent(content, fileName = 'untitled.md', filePath = '') {
  state.currentContent = content;
  state.currentFileName = fileName;
  state.currentFilePath = filePath || fileName;

  el.currentFilename.textContent = fileName;
  el.markdownInput.value = content;
  renderMarkdown(content);
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    loadContent(event.target.result, file.name, file.name);
    addFileToSidebarList(file.name, file.name);
  };
  reader.readAsText(file, 'UTF-8');
}

function handleFolderSelect(e) {
  const files = Array.from(e.target.files);
  const mdFiles = files.filter(f => f.name.endsWith('.md') || f.name.endsWith('.markdown'));

  if (mdFiles.length === 0) {
    alert('No Markdown (.md) files found in the selected folder.');
    return;
  }

  state.files = mdFiles;
  renderSidebarFileList(mdFiles);

  const firstFile = mdFiles[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    loadContent(event.target.result, firstFile.name, firstFile.webkitRelativePath || firstFile.name);
  };
  reader.readAsText(firstFile, 'UTF-8');

  if (!state.sidebarOpen) {
    toggleSidebar();
  }
  switchSidebarTab('files');
}

function renderSidebarFileList(files) {
  el.sidebarFileList.innerHTML = '';
  files.forEach((file, index) => {
    const li = document.createElement('li');
    li.className = `file-item ${index === 0 ? 'active' : ''}`;
    li.dataset.path = file.webkitRelativePath || file.name;
    li.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      </svg>
      <span title="${file.webkitRelativePath || file.name}">${file.name}</span>
    `;

    li.addEventListener('click', () => {
      document.querySelectorAll('.file-item').forEach(item => item.classList.remove('active'));
      li.classList.add('active');

      if (file instanceof File) {
        const reader = new FileReader();
        reader.onload = (event) => {
          loadContent(event.target.result, file.name, file.webkitRelativePath || file.name);
        };
        reader.readAsText(file, 'UTF-8');
      } else if (file.path) {
        fetchFileFromServer(file.path);
      }
    });

    el.sidebarFileList.appendChild(li);
  });
}

function addFileToSidebarList(name, path) {
  const existing = Array.from(el.sidebarFileList.querySelectorAll('.file-item'));
  existing.forEach(i => i.classList.remove('active'));

  const li = document.createElement('li');
  li.className = 'file-item active';
  li.dataset.path = path;
  li.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    </svg>
    <span title="${path}">${name}</span>
  `;
  el.sidebarFileList.prepend(li);
}

// -----------------------------------------------------------------------------
// Drag & Drop
// -----------------------------------------------------------------------------

function setupDragAndDrop() {
  let dragCounter = 0;

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    el.dropOverlay.classList.add('active');
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      el.dropOverlay.classList.remove('active');
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    el.dropOverlay.classList.remove('active');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        loadContent(event.target.result, file.name, file.name);
        addFileToSidebarList(file.name, file.name);
      };
      reader.readAsText(file, 'UTF-8');
    }
  });
}

// -----------------------------------------------------------------------------
// Sidebar Navigation & Search
// -----------------------------------------------------------------------------

function toggleSidebar() {
  state.sidebarOpen = !state.sidebarOpen;
  if (state.sidebarOpen) {
    el.appSidebar.classList.remove('collapsed');
    el.btnToggleSidebar.classList.add('btn-active');
  } else {
    el.appSidebar.classList.add('collapsed');
    el.btnToggleSidebar.classList.remove('btn-active');
  }
}

function switchSidebarTab(tabName) {
  if (tabName === 'files') {
    el.tabFilesBtn.classList.add('active');
    el.tabTocBtn.classList.remove('active');
    el.tabContentFiles.style.display = 'block';
    el.tabContentToc.style.display = 'none';
  } else {
    el.tabTocBtn.classList.add('active');
    el.tabFilesBtn.classList.remove('active');
    el.tabContentToc.style.display = 'block';
    el.tabContentFiles.style.display = 'none';
  }
}

function filterSidebarFiles(query) {
  const items = el.sidebarFileList.querySelectorAll('.file-item');
  const lower = query.toLowerCase();
  items.forEach(item => {
    const text = item.innerText.toLowerCase();
    item.style.display = text.includes(lower) ? 'flex' : 'none';
  });
}

// -----------------------------------------------------------------------------
// Local Node Server API Integration
// -----------------------------------------------------------------------------

async function checkLocalServer() {
  try {
    const res = await fetch('/api/list-files');
    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        renderServerFiles(data.files);
      }
    }
  } catch (err) {
    // Running in static or file:// environment
  }
}

function renderServerFiles(fileList) {
  el.sidebarFileList.innerHTML = '';
  fileList.forEach((file) => {
    const li = document.createElement('li');
    li.className = `file-item ${file.name === state.currentFileName ? 'active' : ''}`;
    li.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      </svg>
      <span title="${file.path}">${file.name}</span>
    `;

    li.addEventListener('click', () => {
      document.querySelectorAll('.file-item').forEach(item => item.classList.remove('active'));
      li.classList.add('active');
      fetchFileFromServer(file.path);
    });

    el.sidebarFileList.appendChild(li);
  });
}

async function fetchFileFromServer(filePath) {
  try {
    const res = await fetch(`/api/read-file?path=${encodeURIComponent(filePath)}`);
    if (res.ok) {
      const text = await res.text();
      const fileName = filePath.split(/[\\/]/).pop();
      loadContent(text, fileName, filePath);
      addFileToSidebarList(fileName, filePath);
    }
  } catch (err) {
    console.error('Failed to load file from server:', err);
  }
}

async function saveFile() {
  const content = el.markdownInput.value;
  try {
    const res = await fetch('/api/save-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: state.currentFilePath,
        content: content
      })
    });
    if (res.ok) {
      alert('File saved successfully!');
    } else {
      downloadAsMarkdownFile();
    }
  } catch (err) {
    downloadAsMarkdownFile();
  }
}

function downloadAsMarkdownFile() {
  const blob = new Blob([el.markdownInput.value], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = state.currentFileName || 'document.md';
  a.click();
}

// -----------------------------------------------------------------------------
// App Initialization & Shortcuts
// -----------------------------------------------------------------------------

function init() {
  // Load Theme
  setTheme(state.currentTheme);
  
  // A4 Mode is OFF by default
  state.isA4Mode = false;
  updateA4ModeButton();

  // Live Editor Typing Listener
  let renderDebounce;
  el.markdownInput.addEventListener('input', () => {
    clearTimeout(renderDebounce);
    renderDebounce = setTimeout(() => {
      state.currentContent = el.markdownInput.value;
      renderMarkdown(state.currentContent);
    }, 150);
  });

  // Action Button Listeners
  el.btnOpenFile.addEventListener('click', () => el.fileInput.click());
  el.btnOpenFolder.addEventListener('click', () => el.folderInput.click());
  el.fileInput.addEventListener('change', handleFileSelect);
  el.folderInput.addEventListener('change', handleFolderSelect);

  el.btnToggleSidebar.addEventListener('click', toggleSidebar);
  el.btnToggleA4.addEventListener('click', toggleA4Mode);
  el.btnToggleTheme.addEventListener('click', cycleTheme);
  el.btnPrintPdf.addEventListener('click', printDocument);
  el.btnSaveLocal.addEventListener('click', saveFile);

  // View Mode Buttons
  el.viewModePreview.addEventListener('click', () => setViewMode('preview'));
  el.viewModeSplit.addEventListener('click', () => setViewMode('split'));
  el.viewModeEditor.addEventListener('click', () => setViewMode('editor'));

  // Sidebar Tabs
  el.tabFilesBtn.addEventListener('click', () => switchSidebarTab('files'));
  el.tabTocBtn.addEventListener('click', () => switchSidebarTab('toc'));
  el.fileSearchInput.addEventListener('input', (e) => filterSidebarFiles(e.target.value));

  // Drag & Drop
  setupDragAndDrop();

  // Keyboard Shortcuts (Ctrl+O, Ctrl+P, Ctrl+S)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      el.fileInput.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      printDocument();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveFile();
    }
  });

  // Load URL (?file=...) or default sample document
  const urlParams = new URLSearchParams(window.location.search);
  const fileParam = urlParams.get('file');

  if (fileParam) {
    fetchFileFromServer(fileParam);
  } else {
    fetch('sample-document.md')
      .then(r => r.text())
      .then(text => {
        loadContent(text, 'sample-document.md', 'sample-document.md');
      })
      .catch(() => {
        console.log('Default sample document could not be fetched.');
      });
  }

  // Scan workspace files via local server API
  checkLocalServer();
}

// Start Application
document.addEventListener('DOMContentLoaded', init);
