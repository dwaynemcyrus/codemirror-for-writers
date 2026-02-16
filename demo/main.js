import { EditorState } from '@codemirror/state';
import { EditorView, scrollPastEnd } from '@codemirror/view';
import {
  hybridMarkdown,
  toggleTheme,
  getTheme,
  toggleHybridMode,
  getMode,
  toggleReadOnly,
  isReadOnly,
  toggleTypewriter,
  isTypewriter,
  toggleFocusMode,
  isFocusMode,
  toggleWordCount,
  isWordCount,
  toggleFrontmatterSheet,
  isFrontmatterSheet,
  tagAutocomplete,
  createNoteIndex,
  resolveWikiLink,
  wikiLinkAutocomplete,
  bottomToolbar,
  moreMenu,
} from '../lib/index.js';
import { autocompletion } from '@codemirror/autocomplete';
import 'katex/dist/katex.min.css';
import './styles.css';
import exampleContent from './public/example.md?raw';

// Create the editor
const container = document.getElementById('app');

// Create editor container structure
const wrapper = document.createElement('div');
wrapper.className = 'editor-wrapper';

const editorContainer = document.createElement('div');
editorContainer.className = 'editor-container';

wrapper.appendChild(editorContainer);
container.appendChild(wrapper);

// Check if we should load example content or start empty
// Use #empty hash to start with an empty editor
const shouldLoadExample = window.location.hash !== '#empty';
const initialContent = shouldLoadExample ? exampleContent : '';

const noteIndex = createNoteIndex([
  { title: 'Project Plan', aliases: ['Plan'] },
  { title: 'Meeting Notes' },
  { title: 'Research Notes' },
  { title: 'Daily Log' },
  { title: 'Release Checklist' },
]);

const wikiLinkTelemetry = {
  last: null,
  clicks: [],
};
window.__wikiLinkTelemetry = wikiLinkTelemetry;

// Initialize editor with the extension
const state = EditorState.create({
  doc: initialContent,
  extensions: [
    scrollPastEnd(),

    // The main hybrid markdown extension
    hybridMarkdown({
      theme: 'light',
      enableCustomTasks: true,
      enableWikiLinks: true,
      renderWikiLinks: true,
      onWikiLinkClick: (link) => {
        const resolved = resolveWikiLink(noteIndex, link);
        wikiLinkTelemetry.last = link;
        wikiLinkTelemetry.clicks.push(link);
        console.info('Wiki link clicked', { link, resolved });
      },
      enableTags: true,
      onTagClick: (tag) => {
        console.info('Tag clicked', tag);
      },
      backlinks: true,
      onBacklinksRequested: async (docTitle) => {
        // Mock async resolver — in a real app, query your note database
        console.info('Backlinks requested for:', docTitle);
        return [
          { title: 'Daily Log', excerpt: 'Referenced in today\'s entry' },
          { title: 'Project Plan', excerpt: 'Linked from the overview section' },
          { title: 'Meeting Notes', excerpt: 'Discussed in last sync' },
        ];
      },
      onBacklinkClick: (backlink) => {
        console.info('Backlink clicked', backlink);
      },
      frontmatterKeys: ['title', 'date', 'tags', 'author', 'description', 'draft', 'category', 'slug', 'image', 'published'],
    }),

    // Autocomplete: wiki links + tags combined into one autocompletion() call
    autocompletion({
      override: [
        wikiLinkAutocomplete({ noteIndex }),
        tagAutocomplete({
          tags: [
            'markdown', 'editor', 'codemirror', 'codemirror/extension', 'codemirror/view',
            'javascript', 'typescript', 'project', 'project/active', 'project/archived',
            'todo', 'done', 'idea', 'bug', 'feature', 'documentation',
          ],
        }),
      ],
    }),

    // Bottom toolbar with formatting buttons
    bottomToolbar(),

    // More menu (top-right ⋯ button with toggle items)
    moreMenu({
      items: [
        { label: 'Dark mode', handler: (v) => toggleTheme(v), getState: (v) => getTheme(v) === 'dark' },
        { label: 'Raw mode', handler: (v) => { toggleHybridMode(v); }, getState: (v) => getMode(v) === 'raw' },
        { label: 'Read-only', handler: (v) => toggleReadOnly(v), getState: (v) => isReadOnly(v) },
        { label: 'Typewriter', handler: (v) => toggleTypewriter(v), getState: (v) => isTypewriter(v) },
        { label: 'Focus mode', handler: (v) => toggleFocusMode(v), getState: (v) => isFocusMode(v) },
        { label: 'Word count', handler: (v) => toggleWordCount(v), getState: (v) => isWordCount(v) },
        { label: 'Properties', handler: (v) => toggleFrontmatterSheet(v), getState: (v) => isFrontmatterSheet(v) },
      ],
    }),
  ],
});

const view = new EditorView({
  state,
  parent: editorContainer,
});

// Move selection to the italic/bold/strikethrough line and focus
// Only if we loaded the example content
if (shouldLoadExample) {
  const targetText = '*Italic*, **bold**';
  const pos = view.state.doc.toString().indexOf(targetText);
  if (pos !== -1) {
    view.dispatch({
      selection: { anchor: pos },
      scrollIntoView: true,
    });
  }
}
view.focus();
