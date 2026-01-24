import { EditorView, showPanel } from '@codemirror/view';
import { actions } from '../lib/index.js';

/**
 * Toolbar button configuration
 */
const toolbarButtons = [
  { icon: 'B', title: 'Bold (Ctrl+B)', action: 'bold', style: 'font-weight: bold' },
  { icon: 'I', title: 'Italic (Ctrl+I)', action: 'italic', style: 'font-style: italic' },
  { icon: 'S', title: 'Strikethrough', action: 'strikethrough', style: 'text-decoration: line-through' },
  { type: 'separator' },
  { icon: 'T', title: 'Heading 1', action: 'h1', style: 'font-weight: bold; font-size: 18px' },
  { icon: 'T', title: 'Heading 2', action: 'h2', style: 'font-weight: bold; font-size: 15px' },
  { icon: 'T', title: 'Heading 3', action: 'h3', style: 'font-weight: bold; font-size: 12px' },
  { type: 'separator' },
  { icon: '\u{1F517}', title: 'Link (Ctrl+K)', action: 'link' },
  { icon: '\u{1F5BC}', title: 'Image', action: 'image' },
  { type: 'separator' },
  { icon: '\u22EE', title: 'Bullet List', action: 'bulletList' },
  { icon: '1.', title: 'Numbered List', action: 'numberedList' },
  { icon: '\u2611', title: 'Task List', action: 'taskList' },
  { type: 'separator' },
  { icon: '<>', title: 'Inline Code', action: 'inlineCode' },
  { icon: '{ }', title: 'Code Block', action: 'codeBlock' },
  { type: 'separator' },
  { icon: '\u2014', title: 'Horizontal Rule', action: 'hr' },
  { icon: '\u201C', title: 'Blockquote', action: 'quote' },
  { type: 'separator' },
  { icon: '\u229E', title: 'Table', action: 'table' },
  { icon: '\u25C7', title: 'Diagram', action: 'diagram' },
  { icon: '\u{1F600}', title: 'Emoji', action: 'emoji' },
];

/**
 * Create toolbar DOM element
 * @param {EditorView} view - The editor view
 * @param {Object} callbacks - Optional callbacks for mode toggle
 * @param {Function} callbacks.onToggleMode - Called when mode toggle is clicked
 */
function createToolbarDOM(view, callbacks = {}) {
  const toolbar = document.createElement('div');
  toolbar.className = 'cm-md-toolbar';

  // Add formatting buttons
  toolbarButtons.forEach(({ icon, title, action, style, type }) => {
    if (type === 'separator') {
      const sep = document.createElement('div');
      sep.className = 'cm-md-toolbar-separator';
      toolbar.appendChild(sep);
      return;
    }

    const btn = document.createElement('button');
    btn.className = 'cm-md-toolbar-btn';
    btn.textContent = icon;
    btn.title = title;
    if (style) {
      btn.style.cssText = style;
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (actions[action]) {
        actions[action](view);
        view.focus();
      }
    });

    toolbar.appendChild(btn);
  });

  // Add spacer to push toggle button to the right
  const spacer = document.createElement('div');
  spacer.className = 'cm-md-toolbar-spacer';
  toolbar.appendChild(spacer);

  // Add mode toggle button (pressed = raw mode)
  if (callbacks.onToggleMode) {
    const modeBtn = document.createElement('button');
    modeBtn.className = 'cm-md-toolbar-btn';
    modeBtn.textContent = '#'; // hash icon
    modeBtn.title = 'Raw Mode';
    modeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isHybrid = callbacks.onToggleMode(view);
      modeBtn.classList.toggle('cm-md-toolbar-btn-pressed', !isHybrid);
      view.focus();
    });
    toolbar.appendChild(modeBtn);
  }

  return toolbar;
}

/**
 * Toolbar theme (bundled styles)
 */
export const toolbarTheme = EditorView.baseTheme({
  '.cm-md-toolbar': {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    background: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
  },
  '.cm-md-toolbar-btn': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '32px',
    height: '32px',
    padding: '0 8px',
    background: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    transition: 'all 0.15s ease',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  '.cm-md-toolbar-btn:hover': {
    background: '#e9ecef',
    borderColor: '#adb5bd',
  },
  '.cm-md-toolbar-btn:active': {
    background: '#dee2e6',
    transform: 'translateY(1px)',
  },
  '.cm-md-toolbar-btn:focus': {
    outline: 'none',
    boxShadow: '0 0 0 2px rgba(34, 139, 230, 0.3)',
  },
  // Pressed/active toggle state
  '.cm-md-toolbar-btn-pressed': {
    background: '#dee2e6',
    borderColor: '#adb5bd',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  '.cm-md-toolbar-btn-pressed:hover': {
    background: '#d3d8de',
  },
  '.cm-md-toolbar-separator': {
    width: '1px',
    height: '24px',
    background: '#dee2e6',
    margin: '0 4px',
  },
  '.cm-md-toolbar-spacer': {
    flexGrow: '1',
  },
  // Dark mode overrides
  '&dark .cm-md-toolbar': {
    background: '#252526',
    borderBottomColor: '#3c3c3c',
  },
  '&dark .cm-md-toolbar-btn': {
    background: '#3c3c3c',
    borderColor: '#555',
    color: '#d4d4d4',
  },
  '&dark .cm-md-toolbar-btn:hover': {
    background: '#4a4a4a',
    borderColor: '#666',
  },
  '&dark .cm-md-toolbar-btn:active': {
    background: '#555',
  },
  '&dark .cm-md-toolbar-btn-pressed': {
    background: '#555',
    borderColor: '#666',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  '&dark .cm-md-toolbar-btn-pressed:hover': {
    background: '#606060',
  },
  '&dark .cm-md-toolbar-separator': {
    background: '#555',
  },
});

/**
 * Create a toolbar extension for the hybrid markdown editor
 *
 * @param {Object} options - Toolbar options
 * @param {Function} [options.onToggleMode] - Callback for mode toggle, receives view, should return true if now hybrid
 * @returns {Extension[]} Array of extensions including panel and styles
 */
export function toolbar(options = {}) {
  const { onToggleMode } = options;

  const panelPlugin = showPanel.of((view) => {
    const dom = createToolbarDOM(view, { onToggleMode });
    return { dom, top: true };
  });

  return [panelPlugin, toolbarTheme];
}
