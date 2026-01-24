# codemirror-markdown-hybrid

A CodeMirror 6 extension for hybrid markdown editing - shows rendered preview for unfocused lines and raw markdown for the line being edited.

## Demo

Try it live: [**Live Demo**](https://tiagosimoes.github.io/codemirror-markdown-hybrid/)

<a href="https://tiagosimoes.github.io/codemirror-markdown-hybrid/">
  <img src="screenshot.png" alt="Screenshot" width="600">
</a>

## Install

```bash
npm install codemirror-markdown-hybrid
```

## Usage

```javascript
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { hybridMarkdown } from 'codemirror-markdown-hybrid';

const state = EditorState.create({
  doc: '# Hello World',
  extensions: [hybridMarkdown({ theme: 'light' })],
});

const view = new EditorView({ state, parent: document.body });
```

## Features

- Hybrid preview - rendered markdown for unfocused lines, raw editing for current line
- Light and dark themes with dynamic switching
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K, etc.)
- Syntax highlighted code blocks
- Tables, task lists, math (KaTeX), mermaid diagrams, and more

## API

### `hybridMarkdown(options?)`

Main extension function. Returns an array of CodeMirror extensions.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `'light'` \| `'dark'` | `'light'` | Initial theme |
| `enablePreview` | `boolean` | `true` | Enable hybrid preview |
| `enableKeymap` | `boolean` | `true` | Enable markdown shortcuts |

### Theme & Mode Functions

- `toggleTheme(view)` - Toggle between light/dark themes, returns `true` if now dark
- `toggleHybridMode(view)` - Toggle between hybrid/raw mode, returns `true` if hybrid
- `setTheme(view, theme)` - Set theme explicitly (`'light'` or `'dark'`)
- `setMode(view, mode)` - Set mode explicitly (`'hybrid'` or `'raw'`)

### Actions

The `actions` export provides formatting functions for building custom toolbars:

```javascript
import { actions } from 'codemirror-markdown-hybrid';

// Available actions: bold, italic, strikethrough, h1, h2, h3,
// link, image, bulletList, numberedList, taskList, inlineCode,
// codeBlock, hr, quote, table, diagram, emoji
actions.bold(view);
```

## License

MIT
