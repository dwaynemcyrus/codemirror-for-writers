import { EditorView, ViewPlugin } from '@codemirror/view';

const moreMenuTheme = EditorView.baseTheme({
  '.cm-more-menu-container': {
    position: 'absolute',
    top: '8px',
    right: '8px',
    zIndex: '6',
  },
  '.cm-more-menu-trigger': {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: 'none',
    background: 'rgba(0, 0, 0, 0.05)',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#555',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  '.cm-more-menu-trigger:hover': {
    background: 'rgba(0, 0, 0, 0.1)',
  },
  '.cm-more-menu-dropdown': {
    position: 'absolute',
    top: '100%',
    right: '0',
    marginTop: '4px',
    minWidth: '180px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)',
    padding: '4px 0',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    overflow: 'hidden',
  },
  '.cm-more-menu-item': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    color: '#333',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    lineHeight: '1.3',
  },
  '.cm-more-menu-item:hover': {
    background: 'rgba(0, 0, 0, 0.05)',
  },
  '.cm-more-menu-check': {
    width: '16px',
    textAlign: 'center',
    flexShrink: '0',
    fontSize: '13px',
    color: '#555',
  },
  // Dark mode
  '&dark .cm-more-menu-trigger': {
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#aaa',
  },
  '&dark .cm-more-menu-trigger:hover': {
    background: 'rgba(255, 255, 255, 0.14)',
  },
  '&dark .cm-more-menu-dropdown': {
    background: '#2d2d2d',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08)',
  },
  '&dark .cm-more-menu-item': {
    color: '#d4d4d4',
  },
  '&dark .cm-more-menu-item:hover': {
    background: 'rgba(255, 255, 255, 0.08)',
  },
  '&dark .cm-more-menu-check': {
    color: '#aaa',
  },
});

/**
 * Create a "more" menu extension that adds a ⋯ button in the top-right
 * corner of the editor with a dropdown of toggle items.
 *
 * @param {Object} [options]
 * @param {Array<{label: string, handler: (view: EditorView) => boolean, getState?: (view: EditorView) => boolean}>} [options.items]
 *   Menu items. `handler` is called on click and should return the new toggle
 *   state (true = on). `getState` reads the current state for the checkmark.
 * @returns {Extension[]}
 */
export function moreMenu(options = {}) {
  const items = options.items || [];

  const plugin = ViewPlugin.fromClass(class {
    constructor(view) {
      this.view = view;
      this.open = false;

      // Container — inline styles ensure visibility above .cm-scroller in all modes
      this.container = document.createElement('div');
      this.container.className = 'cm-more-menu-container';
      Object.assign(this.container.style, {
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: '6',
      });

      // Trigger button
      this.trigger = document.createElement('button');
      this.trigger.className = 'cm-more-menu-trigger';
      this.trigger.textContent = '\u22EF';
      this.trigger.title = 'More options';
      this.trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      });
      this.container.appendChild(this.trigger);

      // Dropdown
      this.dropdown = document.createElement('div');
      this.dropdown.className = 'cm-more-menu-dropdown';
      this.dropdown.style.display = 'none';
      this.container.appendChild(this.dropdown);

      // Menu items
      this.checkEls = [];
      for (const item of items) {
        const btn = document.createElement('button');
        btn.className = 'cm-more-menu-item';

        const check = document.createElement('span');
        check.className = 'cm-more-menu-check';
        check.textContent = item.getState ? (item.getState(view) ? '✓' : '') : '';
        this.checkEls.push({ check, item });

        const label = document.createElement('span');
        label.textContent = item.label;

        btn.appendChild(check);
        btn.appendChild(label);

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          item.handler(view);
          this.refreshChecks();
        });

        this.dropdown.appendChild(btn);
      }

      // Close handlers
      this._onDocClick = (e) => {
        if (this.open && !this.container.contains(e.target)) {
          this.close();
        }
      };
      this._onKeyDown = (e) => {
        if (this.open && e.key === 'Escape') {
          this.close();
        }
      };
      document.addEventListener('click', this._onDocClick, true);
      document.addEventListener('keydown', this._onKeyDown);

      // Insert into editor
      view.dom.appendChild(this.container);
    }

    toggle() {
      this.open ? this.close() : this.show();
    }

    show() {
      this.open = true;
      this.refreshChecks();
      this.dropdown.style.display = '';
    }

    close() {
      this.open = false;
      this.dropdown.style.display = 'none';
    }

    refreshChecks() {
      for (const { check, item } of this.checkEls) {
        check.textContent = item.getState ? (item.getState(this.view) ? '✓' : '') : '';
      }
    }

    update(update) {
      if (this.open) {
        this.refreshChecks();
      }
    }

    destroy() {
      document.removeEventListener('click', this._onDocClick, true);
      document.removeEventListener('keydown', this._onKeyDown);
      this.container.remove();
    }
  });

  return [plugin, moreMenuTheme];
}
