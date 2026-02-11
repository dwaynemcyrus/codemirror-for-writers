# codemirror-for-writers

[![npm version](https://img.shields.io/npm/v/codemirror-for-writers.svg)](https://www.npmjs.com/package/codemirror-for-writers)
[![Tests](https://github.com/dwaynemcyrus/codemirror-for-writers/actions/workflows/test.yml/badge.svg)](https://github.com/dwaynemcyrus/codemirror-for-writers/actions/workflows/test.yml)

A CodeMirror 6 extension for hybrid markdown editing - shows rendered preview for unfocused lines and raw markdown for the line or block being edited, with custom task types for writers.

## Demo

Try it live: [**Live Demo**](https://dwaynemcyrus.github.io/codemirror-for-writers/)

![Demo](demo-video/demo.gif)

## Install

```bash
npm install codemirror-for-writers @codemirror/state @codemirror/view
```

## Usage

```javascript
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { hybridMarkdown } from 'codemirror-for-writers';

const state = EditorState.create({
  doc: '# Hello World',
  extensions: [hybridMarkdown({ theme: 'light' })],
});

const view = new EditorView({ state, parent: document.body });
```

## Features

- Hybrid preview - rendered markdown for unfocused lines, raw editing for current line
- Collapsible headings - click the chevron to collapse/expand sections
- Light and dark themes with dynamic switching
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K, etc.)
- Syntax highlighted code blocks
- Custom task types with emoji indicators (e.g. `[i]`, `[!]`, `[*]`)
- Tables, task lists, math (KaTeX), mermaid diagrams, and more
- Wiki links in preview (`[[title]]`, `[[title|alias]]`, `[[title#section]]`, `[[title#section|alias]]`)

### Wiki Links (App Layer)

This package only handles wiki-link parsing, rendering, and styling inside the editor. Autocomplete, link resolution, and note indexing are app-specific and should live outside the extension. The demo includes a small companion autocomplete plugin in `demo/wiki-link-autocomplete.js` to show the intended separation.

## API

### `hybridMarkdown(options?)`

Main extension function. Returns an array of CodeMirror extensions.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `'light'` \| `'dark'` | `'light'` | Initial theme |
| `enablePreview` | `boolean` | `true` | Enable hybrid preview |
| `enableKeymap` | `boolean` | `true` | Enable markdown shortcuts |
| `enableCollapse` | `boolean` | `true` | Enable collapsible headings |
| `enableCustomTasks` | `boolean` | `false` | Enable custom task types in preview |
| `customTaskTypes` | `string[]` | `['i','!','?','*','>','<']` | Custom task type order |
| `enableWikiLinks` | `boolean` | `false` | Enable wiki-link parsing/highlighting in hybrid preview |
| `renderWikiLinks` | `boolean` | `true` | Render wiki links in preview when enabled |
| `onWikiLinkClick` | `(link) => void` | `undefined` | Optional handler for preview wiki-link clicks (only active when provided) |

### Theme & Mode Functions

- `toggleTheme(view)` - Toggle between light/dark themes, returns `true` if now dark
- `toggleHybridMode(view)` - Toggle between hybrid/raw mode, returns `true` if hybrid
- `setTheme(view, theme)` - Set theme explicitly (`'light'` or `'dark'`)
- `setMode(view, mode)` - Set mode explicitly (`'hybrid'` or `'raw'`)

### Actions

The `actions` export provides formatting functions for building custom toolbars:

```javascript
import { actions } from 'codemirror-for-writers';

// Available actions: undo, redo, search, replace, selectNextOccurrence, selectAllOccurrences, bold, italic, strikethrough, h1, h2, h3,
// link, image, bulletList, numberedList, taskList, inlineCode,
// codeBlock, hr, quote, table, diagram, emoji
actions.bold(view);
```

## License

MIT
