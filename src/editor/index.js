import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, Decoration, ViewPlugin, lineNumbers, rectangularSelection, crosshairCursor, scrollPastEnd } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { search, searchKeymap } from '@codemirror/search';
import { hybridPreview } from './extensions/hybrid-preview.js';
import { markdownKeymap } from './extensions/keymaps.js';
import { lightTheme, darkTheme } from './theme.js';
import { allowReadOnlyEdit } from './read-only.js';

// Theme compartment for dynamic switching
const themeCompartment = new Compartment();

// Hybrid preview compartment for toggling between hybrid and raw mode
const hybridPreviewCompartment = new Compartment();

// Line numbers compartment for toggling gutter visibility
const lineNumberCompartment = new Compartment();

// Scroll past end compartment for toggling extra scroll space
const scrollPastEndCompartment = new Compartment();

// Read-only compartments
const readOnlyCompartment = new Compartment();
const editableCompartment = new Compartment();

const readOnlyTransactionFilter = EditorState.transactionFilter.of((tr) => {
  if (!tr.startState.readOnly || !tr.docChanged) {
    return tr;
  }

  if (tr.annotation(allowReadOnlyEdit)) {
    return tr;
  }

  return { changes: [] };
});

// Track current states
let isDarkMode = false;
let isHybridMode = true;
let lineNumbersEnabled = false;
let scrollPastEndEnabled = true;
let readOnlyEnabled = false;

// Custom extension to highlight all selected lines (only when editor is focused)
const selectedLineDecoration = Decoration.line({ class: 'cm-selectedLine' });

const highlightSelectedLines = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = this.buildDecorations(view);
    }

    update(update) {
      if (update.docChanged || update.selectionSet || update.focusChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view) {
      // Only highlight when editor is focused
      if (!view.hasFocus) {
        return Decoration.none;
      }

      const decorations = [];
      const selectedLines = new Set();
      const state = view.state;

      for (const range of state.selection.ranges) {
        const startLine = state.doc.lineAt(range.from).number;
        const endLine = state.doc.lineAt(range.to).number;
        for (let i = startLine; i <= endLine; i++) {
          selectedLines.add(i);
        }
      }

      for (const lineNum of selectedLines) {
        const line = state.doc.line(lineNum);
        decorations.push(selectedLineDecoration.range(line.from));
      }

      return Decoration.set(decorations, true);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

export function createEditor(parent, initialContent = '') {
  const state = EditorState.create({
    doc: initialContent,
    selection: { anchor: initialContent.length },
    extensions: [
      // Core functionality
      history(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
      ]),

      // Read-only enforcement
      readOnlyTransactionFilter,
      readOnlyCompartment.of(EditorState.readOnly.of(false)),
      editableCompartment.of(EditorView.editable.of(true)),

      // Line numbers (disabled by default)
      lineNumberCompartment.of([]),

      // Scroll past end (enabled by default)
      scrollPastEndCompartment.of(scrollPastEnd()),

      // Search panel + keybindings
      search(),

      // Multiple selections (rectangular selection + crosshair cursor)
      rectangularSelection(),
      crosshairCursor(),

      // Markdown language support (for raw lines)
      markdown(),

      // Custom markdown keybindings
      markdownKeymap,

      // Hybrid preview (in compartment for toggling)
      hybridPreviewCompartment.of(hybridPreview()),

      // Highlight selected lines
      highlightSelectedLines,

      // Theming (in compartment for dynamic switching)
      themeCompartment.of(lightTheme),

      // Line wrapping
      EditorView.lineWrapping,
    ],
  });

  const view = new EditorView({
    state,
    parent,
  });

  return view;
}

/**
 * Toggle between light and dark themes
 * Returns the new theme state (true = dark, false = light)
 */
export function toggleTheme(view) {
  isDarkMode = !isDarkMode;
  const newTheme = isDarkMode ? darkTheme : lightTheme;

  view.dispatch({
    effects: themeCompartment.reconfigure(newTheme),
  });

  // Update body class for CSS styling
  document.body.classList.toggle('dark-mode', isDarkMode);

  return isDarkMode;
}

/**
 * Toggle between hybrid mode (rendered preview) and raw mode (plain markdown)
 * Returns the new mode state (true = hybrid, false = raw)
 */
export function toggleHybridMode(view) {
  isHybridMode = !isHybridMode;

  view.dispatch({
    effects: hybridPreviewCompartment.reconfigure(isHybridMode ? hybridPreview() : []),
  });

  // Update body class for CSS styling
  document.body.classList.toggle('raw-mode', !isHybridMode);

  return isHybridMode;
}

/**
 * Toggle line numbers in the gutter
 * Returns the new state (true = enabled, false = disabled)
 */
export function toggleLineNumbers(view) {
  lineNumbersEnabled = !lineNumbersEnabled;

  view.dispatch({
    effects: lineNumberCompartment.reconfigure(lineNumbersEnabled ? lineNumbers() : []),
  });

  return lineNumbersEnabled;
}

/**
 * Set line numbers explicitly
 * @param {EditorView} view - The editor view
 * @param {boolean} enabled - Whether line numbers are enabled
 */
export function setLineNumbers(view, enabled) {
  lineNumbersEnabled = Boolean(enabled);

  view.dispatch({
    effects: lineNumberCompartment.reconfigure(lineNumbersEnabled ? lineNumbers() : []),
  });
}

/**
 * Get current line numbers state
 */
export function isLineNumbersEnabled() {
  return lineNumbersEnabled;
}

/**
 * Toggle scroll past end
 * Returns the new state (true = enabled, false = disabled)
 */
export function toggleScrollPastEnd(view) {
  scrollPastEndEnabled = !scrollPastEndEnabled;

  view.dispatch({
    effects: scrollPastEndCompartment.reconfigure(scrollPastEndEnabled ? scrollPastEnd() : []),
  });

  return scrollPastEndEnabled;
}

/**
 * Set scroll past end explicitly
 * @param {EditorView} view - The editor view
 * @param {boolean} enabled - Whether scroll past end is enabled
 */
export function setScrollPastEnd(view, enabled) {
  scrollPastEndEnabled = Boolean(enabled);

  view.dispatch({
    effects: scrollPastEndCompartment.reconfigure(scrollPastEndEnabled ? scrollPastEnd() : []),
  });
}

/**
 * Get current scroll past end state
 */
export function isScrollPastEndEnabled() {
  return scrollPastEndEnabled;
}

/**
 * Toggle read-only mode
 * Returns the new state (true = read-only, false = editable)
 */
export function toggleReadOnly(view) {
  readOnlyEnabled = !readOnlyEnabled;

  view.dispatch({
    effects: [
      readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnlyEnabled)),
      editableCompartment.reconfigure(EditorView.editable.of(!readOnlyEnabled)),
    ],
  });

  return readOnlyEnabled;
}

/**
 * Set read-only mode explicitly
 * @param {EditorView} view - The editor view
 * @param {boolean} enabled - Whether the editor is read-only
 */
export function setReadOnly(view, enabled) {
  readOnlyEnabled = Boolean(enabled);

  view.dispatch({
    effects: [
      readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnlyEnabled)),
      editableCompartment.reconfigure(EditorView.editable.of(!readOnlyEnabled)),
    ],
  });
}

/**
 * Get current read-only state
 */
export function isReadOnly() {
  return readOnlyEnabled;
}

/**
 * Get current theme state
 */
export function isDark() {
  return isDarkMode;
}

/**
 * Get current mode state
 */
export function isHybrid() {
  return isHybridMode;
}
