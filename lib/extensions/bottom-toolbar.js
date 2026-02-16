import { EditorView, showPanel } from '@codemirror/view';
import { undoDepth, redoDepth } from '@codemirror/commands';
import { actions } from './actions.js';

const defaultButtons = [
  { icon: '↶', title: 'Undo', action: 'undo' },
  { icon: '↷', title: 'Redo', action: 'redo' },
  { icon: 'B', title: 'Bold', action: 'bold' },
  { icon: 'I', title: 'Italic', action: 'italic' },
  { icon: 'S', title: 'Strikethrough', action: 'strikethrough' },
  { icon: 'H\u2081', title: 'Heading 1', action: 'h1' },
  { icon: 'H\u2082', title: 'Heading 2', action: 'h2' },
  { icon: 'H\u2083', title: 'Heading 3', action: 'h3' },
  { icon: '\u{1F517}', title: 'Link', action: 'link' },
  { icon: '\u{1F5BC}', title: 'Image', action: 'image' },
  { icon: '\u2022', title: 'Bullet List', action: 'bulletList' },
  { icon: '1.', title: 'Numbered List', action: 'numberedList' },
  { icon: '\u2611', title: 'Task List', action: 'taskList' },
  { icon: '< >', title: 'Inline Code', action: 'inlineCode' },
  { icon: '{ }', title: 'Code Block', action: 'codeBlock' },
  { icon: '\u2014', title: 'Horizontal Rule', action: 'hr' },
  { icon: '\u201C', title: 'Blockquote', action: 'quote' },
  { icon: '\u229E', title: 'Table', action: 'table' },
];

const toolbarBaseTheme = EditorView.baseTheme({
  '.cm-bottom-toolbar': {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    padding: '6px 8px',
    paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    whiteSpace: 'nowrap',
    borderTop: '1px solid #dee2e6',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f8f9fa',
    overscrollBehaviorX: 'contain',
    touchAction: 'pan-x',
  },
  '.cm-bottom-toolbar::-webkit-scrollbar': {
    display: 'none',
  },
  '.cm-bottom-toolbar-btn': {
    minWidth: '36px',
    height: '36px',
    flexShrink: '0',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
    color: 'inherit',
    transition: 'background 0.1s',
    padding: '0 4px',
    fontFamily: 'inherit',
  },
  '.cm-bottom-toolbar-btn:hover': {
    background: 'rgba(0, 0, 0, 0.08)',
  },
  '.cm-bottom-toolbar-btn:active': {
    background: 'rgba(0, 0, 0, 0.15)',
  },
  '.cm-bottom-toolbar-btn:disabled': {
    opacity: '0.3',
    cursor: 'not-allowed',
  },
  // Dark mode
  '&dark .cm-bottom-toolbar': {
    background: '#252526',
    borderTopColor: '#3c3c3c',
    color: '#d4d4d4',
  },
  '&dark .cm-bottom-toolbar-btn:hover': {
    background: 'rgba(255, 255, 255, 0.1)',
  },
  '&dark .cm-bottom-toolbar-btn:active': {
    background: 'rgba(255, 255, 255, 0.18)',
  },
});

/**
 * Create a bottom toolbar extension for the markdown editor.
 *
 * @param {Object} [options]
 * @param {Array} [options.buttons] - Override the default button set
 * @param {Array} [options.extraButtons] - Additional buttons appended after defaults.
 *   Each entry: { icon: string, title: string, handler: (view) => void }
 * @returns {Extension[]}
 */
export function bottomToolbar(options = {}) {
  const buttons = options.buttons || defaultButtons;
  const extraButtons = options.extraButtons || [];

  const panelExtension = showPanel.of((view) => {
    const dom = document.createElement('div');
    dom.className = 'cm-bottom-toolbar';

    const buttonsByAction = new Map();

    for (const btn of buttons) {
      const el = document.createElement('button');
      el.className = 'cm-bottom-toolbar-btn';
      el.textContent = btn.icon;
      el.title = btn.title;

      if (btn.action) {
        buttonsByAction.set(btn.action, el);
        el.addEventListener('click', (e) => {
          e.preventDefault();
          if (actions[btn.action]) {
            actions[btn.action](view);
            view.focus();
          }
        });
      }

      dom.appendChild(el);
    }

    // Extra buttons (custom handlers)
    for (const btn of extraButtons) {
      const el = document.createElement('button');
      el.className = 'cm-bottom-toolbar-btn';
      el.textContent = btn.icon;
      el.title = btn.title;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (btn.handler) {
          btn.handler(view);
        }
        view.focus();
      });
      dom.appendChild(el);
    }

    // Fallback for older iOS WebKit: prevent scroll chaining at boundaries
    let touchStartX = 0;
    dom.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    dom.addEventListener('touchmove', (e) => {
      const dx = e.touches[0].clientX - touchStartX;
      const atLeft = dom.scrollLeft <= 0;
      const atRight = dom.scrollLeft + dom.clientWidth >= dom.scrollWidth - 1;
      if ((atLeft && dx > 0) || (atRight && dx < 0)) {
        e.preventDefault();
      }
    }, { passive: false });

    const updateHistoryButtons = (state) => {
      const undoBtn = buttonsByAction.get('undo');
      if (undoBtn) {
        undoBtn.disabled = undoDepth(state) === 0;
      }
      const redoBtn = buttonsByAction.get('redo');
      if (redoBtn) {
        redoBtn.disabled = redoDepth(state) === 0;
      }
    };

    updateHistoryButtons(view.state);

    return {
      dom,
      top: false,
      update(update) {
        updateHistoryButtons(update.state);
      },
    };
  });

  return [panelExtension, toolbarBaseTheme];
}
