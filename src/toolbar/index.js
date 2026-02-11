import { EditorView } from '@codemirror/view';
import { undoDepth, redoDepth } from '@codemirror/commands';
import { actions } from './actions.js';
import { toggleTheme, toggleHybridMode, toggleLineNumbers, isLineNumbersEnabled, toggleReadOnly, isReadOnly } from '../editor/index.js';

const toolbarButtons = [
  { icon: '↶', title: 'Undo (Ctrl+Z)', action: 'undo' },
  { icon: '↷', title: 'Redo (Ctrl+Shift+Z)', action: 'redo' },
  { icon: '🔍', title: 'Search (Ctrl+F)', action: 'search' },
  { icon: '🔁', title: 'Replace (Ctrl+Shift+F)', action: 'replace' },
  { icon: '⧉', title: 'Select Next Occurrence (Ctrl+D)', action: 'selectNextOccurrence' },
  { icon: '⧉⧉', title: 'Select All Occurrences (Ctrl+Shift+L)', action: 'selectAllOccurrences' },
  { type: 'separator' },
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
  { icon: '123', title: 'Show Line Numbers', action: 'toggleLineNumbers' },
  { icon: '🔒', title: 'Enable Read Only', action: 'toggleReadOnly' },
  { icon: '\u{1F4C4}', title: 'Toggle Raw Mode', action: 'toggleMode' },
  { icon: '\u263D', title: 'Toggle Dark Mode', action: 'toggleTheme' },
];

/**
 * Create the toolbar DOM element
 */
export function createToolbar(editorView) {
  const toolbar = document.createElement('div');
  toolbar.className = 'md-toolbar';
  const buttonsByAction = new Map();

  toolbarButtons.forEach(({ icon, title, action, style, type }) => {
    if (type === 'separator') {
      const sep = document.createElement('div');
      sep.className = 'md-toolbar-separator';
      toolbar.appendChild(sep);
      return;
    }

    const btn = document.createElement('button');
    btn.className = 'md-toolbar-btn';
    btn.textContent = icon;
    btn.title = title;
    if (style) {
      btn.style.cssText = style;
    }

    if (action) {
      buttonsByAction.set(action, btn);
    }

    // Special handling for theme toggle
    if (action === 'toggleTheme') {
      btn.id = 'theme-toggle-btn';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const isDark = toggleTheme(editorView);
        // Update icon: moon for light mode (click to go dark), sun for dark mode (click to go light)
        btn.textContent = isDark ? '\u2600' : '\u263D';
        btn.title = isDark ? 'Toggle Light Mode' : 'Toggle Dark Mode';
        editorView.focus();
      });
    // Special handling for mode toggle
    } else if (action === 'toggleMode') {
      btn.id = 'mode-toggle-btn';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const isHybrid = toggleHybridMode(editorView);
        // Update icon: document for hybrid mode (preview), hamburger for raw mode
        btn.textContent = isHybrid ? '\u{1F4C4}' : '\u2261';
        btn.title = isHybrid ? 'Toggle Raw Mode' : 'Toggle Preview Mode';
        editorView.focus();
      });
    } else if (action === 'toggleLineNumbers') {
      btn.id = 'line-numbers-toggle-btn';
      const updateLineNumbersButton = (enabled) => {
        btn.classList.toggle('md-toolbar-btn-pressed', enabled);
        btn.setAttribute('aria-pressed', String(enabled));
        btn.title = enabled ? 'Hide Line Numbers' : 'Show Line Numbers';
      };
      updateLineNumbersButton(isLineNumbersEnabled());
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const enabled = toggleLineNumbers(editorView);
        updateLineNumbersButton(enabled);
        editorView.focus();
      });
    } else if (action === 'toggleReadOnly') {
      btn.id = 'read-only-toggle-btn';
      const updateReadOnlyButton = (enabled) => {
        btn.classList.toggle('md-toolbar-btn-pressed', enabled);
        btn.setAttribute('aria-pressed', String(enabled));
        btn.title = enabled ? 'Disable Read Only' : 'Enable Read Only';
      };
      updateReadOnlyButton(isReadOnly());
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const enabled = toggleReadOnly(editorView);
        updateReadOnlyButton(enabled);
        editorView.focus();
      });
    } else {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (actions[action]) {
          actions[action](editorView);
          editorView.focus();
        }
      });
    }

    toolbar.appendChild(btn);
  });

  const updateHistoryButtons = (state) => {
    const undoBtn = buttonsByAction.get('undo');
    if (undoBtn) {
      const enabled = undoDepth(state) > 0;
      undoBtn.disabled = !enabled;
      undoBtn.classList.toggle('md-toolbar-btn-disabled', !enabled);
      undoBtn.setAttribute('aria-disabled', String(!enabled));
    }

    const redoBtn = buttonsByAction.get('redo');
    if (redoBtn) {
      const enabled = redoDepth(state) > 0;
      redoBtn.disabled = !enabled;
      redoBtn.classList.toggle('md-toolbar-btn-disabled', !enabled);
      redoBtn.setAttribute('aria-disabled', String(!enabled));
    }
  };

  updateHistoryButtons(editorView.state);

  return {
    dom: toolbar,
    update(update) {
      updateHistoryButtons(update.state);
    },
  };
}
