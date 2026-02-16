import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, lineNumbers, scrollPastEnd } from '@codemirror/view';
import {
  hybridMarkdown,
  toggleTheme,
  toggleHybridMode,
  toggleReadOnly,
  toggleTypewriter,
  toggleFocusMode,
  toggleWordCount,
  toggleFrontmatterSheet,
  tagAutocomplete,
  createNoteIndex,
  resolveWikiLink,
  wikiLinkAutocomplete,
} from '../lib/index.js';
import { autocompletion } from '@codemirror/autocomplete';
import { toolbar } from './toolbar.js';
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

const lineNumberCompartment = new Compartment();
let lineNumbersEnabled = false;
const scrollPastEndCompartment = new Compartment();
let scrollPastEndEnabled = true;

// Initialize editor with the extension
const state = EditorState.create({
  doc: initialContent,
  extensions: [
    lineNumberCompartment.of([]),
    scrollPastEndCompartment.of(scrollPastEnd()),

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

    // Optional: Add the toolbar with toggle callback
    toolbar({
      onToggleMode: (view) => {
        const isHybrid = toggleHybridMode(view);
        document.body.classList.toggle('raw-mode', !isHybrid);
        // Also toggle theme: raw mode = dark, hybrid mode = light
        const isDark = toggleTheme(view);
        document.body.classList.toggle('dark-mode', isDark);
        return isHybrid;
      },
      onToggleLineNumbers: (view) => {
        lineNumbersEnabled = !lineNumbersEnabled;
        view.dispatch({
          effects: lineNumberCompartment.reconfigure(lineNumbersEnabled ? lineNumbers() : []),
        });
        return lineNumbersEnabled;
      },
      onToggleScrollPastEnd: (view) => {
        scrollPastEndEnabled = !scrollPastEndEnabled;
        view.dispatch({
          effects: scrollPastEndCompartment.reconfigure(scrollPastEndEnabled ? scrollPastEnd() : []),
        });
        return scrollPastEndEnabled;
      },
      onToggleReadOnly: (view) => toggleReadOnly(view),
      onToggleTypewriter: (view) => toggleTypewriter(view),
      onToggleFocusMode: (view) => toggleFocusMode(view),
      onToggleWordCount: (view) => toggleWordCount(view),
      onToggleFrontmatterSheet: (view) => toggleFrontmatterSheet(view),
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
