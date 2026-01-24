import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  hybridMarkdown,
  toggleTheme,
  toggleHybridMode,
} from '../lib/index.js';
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

// Initialize editor with the extension
const state = EditorState.create({
  doc: exampleContent,
  extensions: [
    // The main hybrid markdown extension
    hybridMarkdown({ theme: 'light' }),

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
    }),
  ],
});

const view = new EditorView({
  state,
  parent: editorContainer,
});

// Move selection to the italic/bold/strikethrough line and focus
const targetText = '*Italic*, **bold**';
const pos = view.state.doc.toString().indexOf(targetText);
if (pos !== -1) {
  view.dispatch({
    selection: { anchor: pos },
    scrollIntoView: true,
  });
}
view.focus();
