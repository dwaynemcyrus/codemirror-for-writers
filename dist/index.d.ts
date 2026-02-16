import type { Extension, Facet } from '@codemirror/state';
import type { EditorView, ViewPlugin } from '@codemirror/view';
import type { CompletionSource } from '@codemirror/autocomplete';

// ---------------------------------------------------------------------------
// Wiki links
// ---------------------------------------------------------------------------

export type WikiLinkPayload = {
  raw: string;
  title: string;
  section: string;
  alias: string;
  display: string;
};

// ---------------------------------------------------------------------------
// Note index (for wiki-link autocomplete)
// ---------------------------------------------------------------------------

export interface NoteEntry {
  title: string;
  aliases?: string[];
}

export interface NoteIndex {
  search(query: string): NoteEntry[];
  resolve(title: string): NoteEntry | null;
}

export function createNoteIndex(notes?: NoteEntry[]): NoteIndex;

export function resolveWikiLink(
  noteIndex: NoteIndex,
  link: { title: string },
): NoteEntry | null;

export function wikiLinkAutocomplete(options?: {
  noteIndex: NoteIndex;
  formatLink?: (note: NoteEntry) => string;
}): CompletionSource;

// ---------------------------------------------------------------------------
// Tag autocomplete
// ---------------------------------------------------------------------------

export function tagAutocomplete(options?: {
  tags?: string[];
}): CompletionSource;

// ---------------------------------------------------------------------------
// hybridMarkdown (main entry)
// ---------------------------------------------------------------------------

export interface HybridMarkdownOptions {
  enablePreview?: boolean;
  enableKeymap?: boolean;
  enableCollapse?: boolean;
  theme?: 'light' | 'dark';
  enableCustomTasks?: boolean;
  customTaskTypes?: string[];
  enableWikiLinks?: boolean;
  renderWikiLinks?: boolean;
  onWikiLinkClick?: (link: WikiLinkPayload) => void;
  enableTags?: boolean;
  onTagClick?: (tag: string) => void;
  readOnly?: boolean;
  typewriter?: boolean;
  focusMode?: boolean;
  wordCount?: boolean;
  backlinks?: boolean;
  docTitle?: string;
  onBacklinksRequested?: (title: string) => Promise<BacklinkEntry[]>;
  onBacklinkClick?: (backlink: BacklinkEntry) => void;
  frontmatterKeys?: string[];
}

export function hybridMarkdown(options?: HybridMarkdownOptions): Extension[];

// ---------------------------------------------------------------------------
// Theme & mode
// ---------------------------------------------------------------------------

export function toggleTheme(view: EditorView): boolean;
export function toggleHybridMode(view: EditorView): boolean;
export function setTheme(view: EditorView, theme: 'light' | 'dark'): void;
export function setMode(view: EditorView, mode: 'hybrid' | 'raw'): void;
export function getTheme(view: EditorView): 'light' | 'dark';
export function getMode(view: EditorView): 'hybrid' | 'raw';

// ---------------------------------------------------------------------------
// Read-only
// ---------------------------------------------------------------------------

export function toggleReadOnly(view: EditorView): boolean;
export function setReadOnly(view: EditorView, readOnly: boolean): void;
export function isReadOnly(view: EditorView): boolean;

// ---------------------------------------------------------------------------
// Typewriter
// ---------------------------------------------------------------------------

export function toggleTypewriter(view: EditorView): boolean;
export function setTypewriter(view: EditorView, enabled: boolean): void;
export function isTypewriter(view: EditorView): boolean;

// ---------------------------------------------------------------------------
// Focus mode
// ---------------------------------------------------------------------------

export function toggleFocusMode(view: EditorView): boolean;
export function setFocusMode(view: EditorView, enabled: boolean): void;
export function isFocusMode(view: EditorView): boolean;

// ---------------------------------------------------------------------------
// Word count
// ---------------------------------------------------------------------------

export function toggleWordCount(view: EditorView): boolean;
export function setWordCount(view: EditorView, enabled: boolean): void;
export function isWordCount(view: EditorView): boolean;

// ---------------------------------------------------------------------------
// Backlinks
// ---------------------------------------------------------------------------

export interface BacklinkEntry {
  title: string;
  excerpt?: string;
}

export function toggleBacklinks(view: EditorView): boolean;
export function setBacklinks(view: EditorView, enabled: boolean): void;
export function isBacklinks(view: EditorView): boolean;

// ---------------------------------------------------------------------------
// Frontmatter sheet
// ---------------------------------------------------------------------------

export function toggleFrontmatterSheet(view: EditorView): boolean;
export function setFrontmatterSheet(view: EditorView, open: boolean): void;
export function isFrontmatterSheet(view: EditorView): boolean;

// ---------------------------------------------------------------------------
// Actions (formatting toolbar helpers)
// ---------------------------------------------------------------------------

export const actions: {
  undo(view: EditorView): void;
  redo(view: EditorView): void;
  search(view: EditorView): void;
  replace(view: EditorView): void;
  selectNextOccurrence(view: EditorView): void;
  selectAllOccurrences(view: EditorView): void;
  bold(view: EditorView): void;
  italic(view: EditorView): void;
  strikethrough(view: EditorView): void;
  h1(view: EditorView): void;
  h2(view: EditorView): void;
  h3(view: EditorView): void;
  link(view: EditorView): void;
  image(view: EditorView): void;
  bulletList(view: EditorView): void;
  numberedList(view: EditorView): void;
  taskList(view: EditorView): void;
  inlineCode(view: EditorView): void;
  codeBlock(view: EditorView): void;
  hr(view: EditorView): void;
  quote(view: EditorView): void;
  table(view: EditorView): void;
  diagram(view: EditorView): void;
  emoji(view: EditorView): void;
};

// ---------------------------------------------------------------------------
// Re-exported extensions for advanced composition
// ---------------------------------------------------------------------------

export const lightTheme: Extension;
export const darkTheme: Extension;
export const baseTheme: Extension;

export function hybridPreview(options?: {
  enableCollapse?: boolean;
  enableCustomTasks?: boolean;
  customTaskTypes?: string[];
  enableWikiLinks?: boolean;
  renderWikiLinks?: boolean;
  onWikiLinkClick?: (link: WikiLinkPayload) => void;
  enableTags?: boolean;
  onTagClick?: (tag: string) => void;
}): Extension;

export const markdownKeymap: Extension;
export const highlightSelectedLines: Extension;
export const typewriterPlugin: Extension;
export const focusModePlugin: Extension;
export const wordCountPanel: Extension;
export const backlinksPanel: Extension;
export const frontmatterSheetPlugin: ViewPlugin<any>;

export const backlinksFacet: Facet<
  {
    docTitle: string | null;
    onBacklinksRequested: ((title: string) => Promise<BacklinkEntry[]>) | null;
    onBacklinkClick: ((backlink: BacklinkEntry) => void) | null;
  },
  {
    docTitle: string | null;
    onBacklinksRequested: ((title: string) => Promise<BacklinkEntry[]>) | null;
    onBacklinkClick: ((backlink: BacklinkEntry) => void) | null;
  }
>;

export const frontmatterKeysFacet: Facet<string[], string[]>;

export const HybridMarkdownConfig: Facet<HybridMarkdownOptions, Required<HybridMarkdownOptions>>;

export interface BottomToolbarButton {
  icon: string;
  title: string;
  action?: string;
  handler?: (view: EditorView) => void;
}

export function bottomToolbar(options?: {
  buttons?: BottomToolbarButton[];
  extraButtons?: BottomToolbarButton[];
}): Extension[];

export interface MoreMenuItem {
  label: string;
  handler: (view: EditorView) => boolean;
  getState?: (view: EditorView) => boolean;
}

export function moreMenu(options?: {
  items?: MoreMenuItem[];
}): Extension[];
