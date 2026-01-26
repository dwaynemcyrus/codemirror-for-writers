import { EditorView } from '@codemirror/view';
import { Compartment, Facet, StateField, StateEffect } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

// Internal extensions
import { hybridPreview } from './extensions/hybrid-preview.js';
import { markdownKeymap } from './extensions/keymaps.js';
import { highlightSelectedLines } from './extensions/selected-line.js';
import { actions } from './extensions/actions.js';

// Themes
import { baseTheme } from './theme/base.js';
import { lightTheme } from './theme/light.js';
import { darkTheme } from './theme/dark.js';
import { rawModeTheme, rawModeDarkTheme } from './theme/raw-mode.js';

/**
 * Configuration options for the hybrid markdown extension
 */
export const HybridMarkdownConfig = Facet.define({
  combine(configs) {
    return {
      enablePreview: configs.reduce((a, c) => c.enablePreview ?? a, true),
      enableKeymap: configs.reduce((a, c) => c.enableKeymap ?? a, true),
      theme: configs.reduce((a, c) => c.theme ?? a, 'light'),
    };
  },
});

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
//
// Editor state (theme, mode) is stored in a StateField rather than global
// variables. This ensures:
// - Multiple editor instances work correctly on the same page
// - State is properly isolated per editor
// - State can be serialized/restored if needed
//
// To modify state, dispatch a StateEffect which the StateField responds to.
// ============================================================================

/**
 * StateEffect for changing theme
 * @type {StateEffectType<'light'|'dark'>}
 */
const setThemeEffect = StateEffect.define();

/**
 * StateEffect for changing mode
 * @type {StateEffectType<'hybrid'|'raw'>}
 */
const setModeEffect = StateEffect.define();

/**
 * StateField that stores the current theme and mode for this editor instance.
 * This replaces global variables, allowing multiple editors on the same page.
 */
const editorStateField = StateField.define({
  create(state) {
    // Read initial values from the configuration facet
    const config = state.facet(HybridMarkdownConfig);
    return {
      theme: config.theme || 'light',
      mode: config.enablePreview !== false ? 'hybrid' : 'raw',
    };
  },
  update(value, tr) {
    // Apply any theme/mode effects
    for (const effect of tr.effects) {
      if (effect.is(setThemeEffect)) {
        value = { ...value, theme: effect.value };
      } else if (effect.is(setModeEffect)) {
        value = { ...value, mode: effect.value };
      }
    }
    return value;
  },
});

// Compartments for dynamic reconfiguration
const themeCompartment = new Compartment();
const previewCompartment = new Compartment();
const rawModeCompartment = new Compartment();
const selectedLineCompartment = new Compartment();

/**
 * Get the theme extension for the given theme name
 */
function getThemeExtension(theme) {
  return theme === 'dark' ? darkTheme : lightTheme;
}

/**
 * Get the raw mode extension for the given theme
 */
function getRawModeExtension(theme, enabled) {
  if (!enabled) return [];
  return theme === 'dark' ? rawModeDarkTheme : rawModeTheme;
}

/**
 * Create the hybrid markdown extension
 *
 * @param {Object} options - Configuration options
 * @param {boolean} [options.enablePreview=true] - Enable hybrid preview mode
 * @param {boolean} [options.enableKeymap=true] - Enable markdown keyboard shortcuts
 * @param {'light'|'dark'} [options.theme='light'] - Initial theme
 * @returns {Extension[]} Array of CodeMirror extensions
 *
 * @example
 * import { EditorState } from '@codemirror/state';
 * import { EditorView } from '@codemirror/view';
 * import { hybridMarkdown } from 'codemirror-markdown-hybrid';
 *
 * const state = EditorState.create({
 *   doc: '# Hello World',
 *   extensions: [
 *     hybridMarkdown({ theme: 'dark' }),
 *   ],
 * });
 *
 * const view = new EditorView({ state, parent: document.body });
 */
export function hybridMarkdown(options = {}) {
  const {
    enablePreview = true,
    enableKeymap = true,
    theme = 'light',
  } = options;

  const extensions = [
    // Store configuration in facet (for StateField to read initial values)
    HybridMarkdownConfig.of(options),

    // StateField for tracking theme/mode per editor instance
    editorStateField,

    // Core functionality
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),

    // Markdown language support
    markdown(),

    // Base theme (required styles)
    baseTheme,

    // Theme (in compartment for dynamic switching)
    themeCompartment.of(getThemeExtension(theme)),

    // Raw mode theme (in compartment for toggling)
    rawModeCompartment.of(getRawModeExtension(theme, !enablePreview)),

    // Highlight selected lines (disabled in raw mode)
    selectedLineCompartment.of(enablePreview ? highlightSelectedLines : []),

    // Line wrapping
    EditorView.lineWrapping,
  ];

  // Optional: Hybrid preview
  if (enablePreview) {
    extensions.push(previewCompartment.of(hybridPreview()));
  } else {
    extensions.push(previewCompartment.of([]));
  }

  // Optional: Markdown keyboard shortcuts
  if (enableKeymap) {
    extensions.push(markdownKeymap);
  }

  return extensions;
}

/**
 * Toggle between light and dark themes
 * @param {EditorView} view - The editor view
 * @returns {boolean} True if now in dark mode, false if light
 */
export function toggleTheme(view) {
  const currentState = view.state.field(editorStateField);
  const newTheme = currentState.theme === 'light' ? 'dark' : 'light';

  view.dispatch({
    effects: [
      setThemeEffect.of(newTheme),
      themeCompartment.reconfigure(getThemeExtension(newTheme)),
      rawModeCompartment.reconfigure(getRawModeExtension(newTheme, currentState.mode === 'raw')),
    ],
  });

  return newTheme === 'dark';
}

/**
 * Toggle between hybrid preview mode and raw markdown mode
 * @param {EditorView} view - The editor view
 * @returns {boolean} True if in hybrid mode, false if raw
 */
export function toggleHybridMode(view) {
  const currentState = view.state.field(editorStateField);
  const newMode = currentState.mode === 'hybrid' ? 'raw' : 'hybrid';
  const isHybrid = newMode === 'hybrid';

  view.dispatch({
    effects: [
      setModeEffect.of(newMode),
      previewCompartment.reconfigure(isHybrid ? hybridPreview() : []),
      rawModeCompartment.reconfigure(getRawModeExtension(currentState.theme, !isHybrid)),
      selectedLineCompartment.reconfigure(isHybrid ? highlightSelectedLines : []),
    ],
  });

  return isHybrid;
}

/**
 * Set the theme explicitly
 * @param {EditorView} view - The editor view
 * @param {'light'|'dark'} theme - The theme to set
 */
export function setTheme(view, theme) {
  const currentState = view.state.field(editorStateField);

  view.dispatch({
    effects: [
      setThemeEffect.of(theme),
      themeCompartment.reconfigure(getThemeExtension(theme)),
      rawModeCompartment.reconfigure(getRawModeExtension(theme, currentState.mode === 'raw')),
    ],
  });
}

/**
 * Set the mode explicitly
 * @param {EditorView} view - The editor view
 * @param {'hybrid'|'raw'} mode - The mode to set
 */
export function setMode(view, mode) {
  const currentState = view.state.field(editorStateField);
  const isHybrid = mode === 'hybrid';

  view.dispatch({
    effects: [
      setModeEffect.of(mode),
      previewCompartment.reconfigure(isHybrid ? hybridPreview() : []),
      rawModeCompartment.reconfigure(getRawModeExtension(currentState.theme, !isHybrid)),
      selectedLineCompartment.reconfigure(isHybrid ? highlightSelectedLines : []),
    ],
  });
}

/**
 * Get current theme for an editor instance
 * @param {EditorView} view - The editor view
 * @returns {'light'|'dark'}
 */
export function getTheme(view) {
  return view.state.field(editorStateField).theme;
}

/**
 * Get current mode for an editor instance
 * @param {EditorView} view - The editor view
 * @returns {'hybrid'|'raw'}
 */
export function getMode(view) {
  return view.state.field(editorStateField).mode;
}

// Re-export actions for toolbar/external use
export { actions };

// Re-export individual themes for advanced use cases
export { lightTheme, darkTheme, baseTheme };

// Re-export extensions for advanced composition
export { hybridPreview } from './extensions/hybrid-preview.js';
export { markdownKeymap } from './extensions/keymaps.js';
export { highlightSelectedLines } from './extensions/selected-line.js';
