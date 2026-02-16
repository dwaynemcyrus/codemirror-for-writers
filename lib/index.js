import { EditorView, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { EditorState, Compartment, Facet, StateField, StateEffect } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { search, searchKeymap } from '@codemirror/search';

// Internal extensions
import { hybridPreview } from './extensions/hybrid-preview.js';
import { markdownKeymap } from './extensions/keymaps.js';
import { highlightSelectedLines } from './extensions/selected-line.js';
import { actions } from './extensions/actions.js';
import { allowReadOnlyEdit } from './extensions/read-only.js';
import { typewriterPlugin } from './extensions/typewriter.js';
import { focusModePlugin } from './extensions/focus-mode.js';
import { wordCountPanel } from './extensions/word-count.js';
import { backlinksPanel, backlinksFacet } from './extensions/backlinks.js';
import { frontmatterSheetPlugin, frontmatterKeysFacet } from './extensions/frontmatter-sheet.js';
import { toggleSheetEffect, frontmatterSheetField } from './extensions/hybrid-preview.js';

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
      enableCollapse: configs.reduce((a, c) => c.enableCollapse ?? a, true),
      enableCustomTasks: configs.reduce((a, c) => c.enableCustomTasks ?? a, false),
      customTaskTypes: configs.reduce((a, c) => c.customTaskTypes ?? a, undefined),
      enableWikiLinks: configs.reduce((a, c) => c.enableWikiLinks ?? a, false),
      enableTags: configs.reduce((a, c) => c.enableTags ?? a, false),
      onTagClick: configs.reduce((a, c) => c.onTagClick ?? a, undefined),
      renderWikiLinks: configs.reduce((a, c) => c.renderWikiLinks ?? a, true),
      onWikiLinkClick: configs.reduce((a, c) => c.onWikiLinkClick ?? a, undefined),
      readOnly: configs.reduce((a, c) => c.readOnly ?? a, false),
      typewriter: configs.reduce((a, c) => c.typewriter ?? a, false),
      focusMode: configs.reduce((a, c) => c.focusMode ?? a, false),
      wordCount: configs.reduce((a, c) => c.wordCount ?? a, false),
      backlinks: configs.reduce((a, c) => c.backlinks ?? a, false),
      docTitle: configs.reduce((a, c) => c.docTitle ?? a, undefined),
      onBacklinksRequested: configs.reduce((a, c) => c.onBacklinksRequested ?? a, undefined),
      onBacklinkClick: configs.reduce((a, c) => c.onBacklinkClick ?? a, undefined),
      frontmatterKeys: configs.reduce((a, c) => c.frontmatterKeys ?? a, undefined),
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
 * StateEffect for changing read-only mode
 * @type {StateEffectType<boolean>}
 */
const setReadOnlyEffect = StateEffect.define();

/**
 * StateEffect for changing typewriter mode
 * @type {StateEffectType<boolean>}
 */
const setTypewriterEffect = StateEffect.define();

/**
 * StateEffect for changing focus mode
 * @type {StateEffectType<boolean>}
 */
const setFocusModeEffect = StateEffect.define();

/**
 * StateEffect for changing word count panel visibility
 * @type {StateEffectType<boolean>}
 */
const setWordCountEffect = StateEffect.define();

/**
 * StateEffect for changing backlinks panel visibility
 * @type {StateEffectType<boolean>}
 */
const setBacklinksEffect = StateEffect.define();

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
      readOnly: config.readOnly === true,
      typewriter: config.typewriter === true,
      focusMode: config.focusMode === true,
      wordCount: config.wordCount === true,
      backlinks: config.backlinks === true,
    };
  },
  update(value, tr) {
    // Apply any theme/mode effects
    for (const effect of tr.effects) {
      if (effect.is(setThemeEffect)) {
        value = { ...value, theme: effect.value };
      } else if (effect.is(setModeEffect)) {
        value = { ...value, mode: effect.value };
      } else if (effect.is(setReadOnlyEffect)) {
        value = { ...value, readOnly: effect.value };
      } else if (effect.is(setTypewriterEffect)) {
        value = { ...value, typewriter: effect.value };
      } else if (effect.is(setFocusModeEffect)) {
        value = { ...value, focusMode: effect.value };
      } else if (effect.is(setWordCountEffect)) {
        value = { ...value, wordCount: effect.value };
      } else if (effect.is(setBacklinksEffect)) {
        value = { ...value, backlinks: effect.value };
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
const readOnlyCompartment = new Compartment();
const typewriterCompartment = new Compartment();
const focusModeCompartment = new Compartment();
const wordCountCompartment = new Compartment();
const backlinksCompartment = new Compartment();

const readOnlyTransactionFilter = EditorState.transactionFilter.of((tr) => {
  if (!tr.startState.readOnly || !tr.docChanged) {
    return tr;
  }

  if (tr.annotation(allowReadOnlyEdit)) {
    return tr;
  }

  return { changes: [] };
});

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
 * @param {boolean} [options.enableCustomTasks=false] - Enable custom task types in preview
 * @param {string[]} [options.customTaskTypes] - Custom task type order (e.g. ['i','!','?','*','>','<'])
 * @param {boolean} [options.enableWikiLinks=false] - Enable wiki-link parsing/highlighting in hybrid preview
 * @param {boolean} [options.renderWikiLinks=true] - Render wiki links in preview when enabled
 * @param {(link: {raw: string, title: string, section: string, alias: string, display: string}) => void} [options.onWikiLinkClick] - Optional handler for preview wiki-link clicks
 * @param {boolean} [options.readOnly=false] - Enable read-only mode (allows task toggles)
 * @returns {Extension[]} Array of CodeMirror extensions
 *
 * @example
 * import { EditorState } from '@codemirror/state';
 * import { EditorView } from '@codemirror/view';
 * import { hybridMarkdown } from 'codemirror-for-writers';
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
    enableCollapse = true,
    theme = 'light',
    enableCustomTasks = false,
    customTaskTypes,
    enableWikiLinks = false,
    renderWikiLinks = true,
    onWikiLinkClick,
    enableTags = false,
    onTagClick,
    readOnly = false,
    typewriter = false,
    focusMode = false,
    wordCount = false,
    backlinks = false,
    docTitle,
    onBacklinksRequested,
    onBacklinkClick,
    frontmatterKeys,
  } = options;

  const extensions = [
    // Store configuration in facet (for StateField to read initial values)
    HybridMarkdownConfig.of(options),

    // StateField for tracking theme/mode per editor instance
    editorStateField,

    // Read-only enforcement
    readOnlyTransactionFilter,
    readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),

    // Core functionality
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),

    // Search panel + keybindings
    search(),

    // Multiple selections (rectangular selection + crosshair cursor)
    rectangularSelection(),
    crosshairCursor(),

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

    // Typewriter mode (cursor stays vertically centered)
    typewriterCompartment.of(typewriter ? typewriterPlugin : []),

    // Focus mode (dims non-active paragraphs)
    focusModeCompartment.of(focusMode ? focusModePlugin : []),

    // Word count panel (bottom status bar)
    wordCountCompartment.of(wordCount ? wordCountPanel : []),

    // Backlinks panel (bottom panel showing incoming links)
    backlinksFacet.of({
      docTitle: docTitle || null,
      onBacklinksRequested: typeof onBacklinksRequested === 'function' ? onBacklinksRequested : null,
      onBacklinkClick: typeof onBacklinkClick === 'function' ? onBacklinkClick : null,
    }),
    backlinksCompartment.of(backlinks ? backlinksPanel : []),

    // Frontmatter sheet overlay (always loaded, just hidden when closed)
    frontmatterKeysFacet.of(Array.isArray(frontmatterKeys) ? frontmatterKeys : []),
    frontmatterSheetPlugin,

    // Line wrapping
    EditorView.lineWrapping,
  ];

  // Optional: Hybrid preview
  if (enablePreview) {
    extensions.push(previewCompartment.of(hybridPreview({
      enableCollapse,
      enableCustomTasks,
      customTaskTypes,
      enableWikiLinks,
      renderWikiLinks,
      onWikiLinkClick,
      enableTags,
      onTagClick,
    })));
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
  const config = view.state.facet(HybridMarkdownConfig);

  view.dispatch({
    effects: [
      setModeEffect.of(newMode),
      previewCompartment.reconfigure(isHybrid ? hybridPreview({
        enableCollapse: config.enableCollapse,
        enableCustomTasks: config.enableCustomTasks,
        customTaskTypes: config.customTaskTypes,
      }) : []),
      rawModeCompartment.reconfigure(getRawModeExtension(currentState.theme, !isHybrid)),
      selectedLineCompartment.reconfigure(isHybrid ? highlightSelectedLines : []),
    ],
  });

  return isHybrid;
}

/**
 * Toggle read-only mode
 * @param {EditorView} view - The editor view
 * @returns {boolean} True if now read-only, false if editable
 */
export function toggleReadOnly(view) {
  const currentState = view.state.field(editorStateField);
  const newReadOnly = !currentState.readOnly;

  view.dispatch({
    effects: [
      setReadOnlyEffect.of(newReadOnly),
      readOnlyCompartment.reconfigure(EditorState.readOnly.of(newReadOnly)),
    ],
  });

  return newReadOnly;
}

/**
 * Set read-only mode explicitly
 * @param {EditorView} view - The editor view
 * @param {boolean} readOnly - Whether the editor should be read-only
 */
export function setReadOnly(view, readOnly) {
  view.dispatch({
    effects: [
      setReadOnlyEffect.of(readOnly),
      readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
    ],
  });
}

/**
 * Toggle typewriter mode
 * @param {EditorView} view - The editor view
 * @returns {boolean} True if now enabled
 */
export function toggleTypewriter(view) {
  const currentState = view.state.field(editorStateField);
  const enabled = !currentState.typewriter;

  view.dispatch({
    effects: [
      setTypewriterEffect.of(enabled),
      typewriterCompartment.reconfigure(enabled ? typewriterPlugin : []),
    ],
  });

  return enabled;
}

/**
 * Set typewriter mode explicitly
 * @param {EditorView} view - The editor view
 * @param {boolean} enabled - Whether typewriter mode should be enabled
 */
export function setTypewriter(view, enabled) {
  view.dispatch({
    effects: [
      setTypewriterEffect.of(enabled),
      typewriterCompartment.reconfigure(enabled ? typewriterPlugin : []),
    ],
  });
}

/**
 * Get current typewriter mode state
 * @param {EditorView} view - The editor view
 * @returns {boolean}
 */
export function isTypewriter(view) {
  return view.state.field(editorStateField).typewriter;
}

/**
 * Toggle focus mode
 * @param {EditorView} view - The editor view
 * @returns {boolean} True if now enabled
 */
export function toggleFocusMode(view) {
  const currentState = view.state.field(editorStateField);
  const enabled = !currentState.focusMode;

  view.dispatch({
    effects: [
      setFocusModeEffect.of(enabled),
      focusModeCompartment.reconfigure(enabled ? focusModePlugin : []),
    ],
  });

  return enabled;
}

/**
 * Set focus mode explicitly
 * @param {EditorView} view - The editor view
 * @param {boolean} enabled - Whether focus mode should be enabled
 */
export function setFocusMode(view, enabled) {
  view.dispatch({
    effects: [
      setFocusModeEffect.of(enabled),
      focusModeCompartment.reconfigure(enabled ? focusModePlugin : []),
    ],
  });
}

/**
 * Get current focus mode state
 * @param {EditorView} view - The editor view
 * @returns {boolean}
 */
export function isFocusMode(view) {
  return view.state.field(editorStateField).focusMode;
}

/**
 * Toggle word count panel
 * @param {EditorView} view - The editor view
 * @returns {boolean} True if now enabled
 */
export function toggleWordCount(view) {
  const currentState = view.state.field(editorStateField);
  const enabled = !currentState.wordCount;

  view.dispatch({
    effects: [
      setWordCountEffect.of(enabled),
      wordCountCompartment.reconfigure(enabled ? wordCountPanel : []),
    ],
  });

  return enabled;
}

/**
 * Set word count panel explicitly
 * @param {EditorView} view - The editor view
 * @param {boolean} enabled - Whether the word count panel should be shown
 */
export function setWordCount(view, enabled) {
  view.dispatch({
    effects: [
      setWordCountEffect.of(enabled),
      wordCountCompartment.reconfigure(enabled ? wordCountPanel : []),
    ],
  });
}

/**
 * Get current word count panel state
 * @param {EditorView} view - The editor view
 * @returns {boolean}
 */
export function isWordCount(view) {
  return view.state.field(editorStateField).wordCount;
}

/**
 * Toggle backlinks panel
 * @param {EditorView} view - The editor view
 * @returns {boolean} True if now enabled
 */
export function toggleBacklinks(view) {
  const currentState = view.state.field(editorStateField);
  const enabled = !currentState.backlinks;

  view.dispatch({
    effects: [
      setBacklinksEffect.of(enabled),
      backlinksCompartment.reconfigure(enabled ? backlinksPanel : []),
    ],
  });

  return enabled;
}

/**
 * Set backlinks panel explicitly
 * @param {EditorView} view - The editor view
 * @param {boolean} enabled - Whether the backlinks panel should be shown
 */
export function setBacklinks(view, enabled) {
  view.dispatch({
    effects: [
      setBacklinksEffect.of(enabled),
      backlinksCompartment.reconfigure(enabled ? backlinksPanel : []),
    ],
  });
}

/**
 * Get current backlinks panel state
 * @param {EditorView} view - The editor view
 * @returns {boolean}
 */
export function isBacklinks(view) {
  return view.state.field(editorStateField).backlinks;
}

/**
 * Toggle the frontmatter properties sheet overlay
 * @param {EditorView} view - The editor view
 * @returns {boolean} True if now open, false if closed
 */
export function toggleFrontmatterSheet(view) {
  const isOpen = view.state.field(frontmatterSheetField);
  view.dispatch({ effects: toggleSheetEffect.of(!isOpen) });
  return !isOpen;
}

/**
 * Set the frontmatter sheet state explicitly
 * @param {EditorView} view - The editor view
 * @param {boolean} open - Whether the sheet should be open
 */
export function setFrontmatterSheet(view, open) {
  view.dispatch({ effects: toggleSheetEffect.of(open) });
}

/**
 * Get current frontmatter sheet state
 * @param {EditorView} view - The editor view
 * @returns {boolean}
 */
export function isFrontmatterSheet(view) {
  return view.state.field(frontmatterSheetField);
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
  const config = view.state.facet(HybridMarkdownConfig);

  view.dispatch({
    effects: [
      setModeEffect.of(mode),
      previewCompartment.reconfigure(isHybrid ? hybridPreview({
        enableCollapse: config.enableCollapse,
        enableCustomTasks: config.enableCustomTasks,
        customTaskTypes: config.customTaskTypes,
      }) : []),
      rawModeCompartment.reconfigure(getRawModeExtension(currentState.theme, !isHybrid)),
      selectedLineCompartment.reconfigure(isHybrid ? highlightSelectedLines : []),
    ],
  });
}

/**
 * Get current read-only state for an editor instance
 * @param {EditorView} view - The editor view
 * @returns {boolean}
 */
export function isReadOnly(view) {
  return view.state.field(editorStateField).readOnly;
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
export { typewriterPlugin } from './extensions/typewriter.js';
export { focusModePlugin } from './extensions/focus-mode.js';
export { wordCountPanel } from './extensions/word-count.js';
export { tagAutocomplete } from './extensions/tag-autocomplete.js';
export { createNoteIndex, resolveWikiLink, wikiLinkAutocomplete } from './extensions/wiki-link-autocomplete.js';
export { backlinksPanel } from './extensions/backlinks.js';
export { bottomToolbar } from './extensions/bottom-toolbar.js';
export { moreMenu } from './extensions/more-menu.js';
