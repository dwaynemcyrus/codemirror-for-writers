# codemirror-for-writers

[![npm version](https://img.shields.io/npm/v/codemirror-for-writers.svg)](https://www.npmjs.com/package/codemirror-for-writers)

A CodeMirror 6 extension for hybrid markdown editing — shows rendered preview for unfocused lines and raw markdown for the line being edited. Designed for writing apps like Bear, Obsidian, and iA Writer.

## Demo

Try it live: [**Live Demo**](https://dwaynemcyrus.github.io/codemirror-for-writers/)

![Demo](demo-video/demo.gif)

## Install

This extension requires [CodeMirror 6](https://codemirror.net/). Install CodeMirror and the extension together:

```bash
npm install codemirror-for-writers @codemirror/state @codemirror/view @codemirror/commands @codemirror/lang-markdown @codemirror/search
```

### Optional Dependencies

The following peer dependencies are **not** installed automatically. Install only the ones you need:

```bash
# Autocomplete — required for wiki link and tag autocomplete
npm install @codemirror/autocomplete

# Math rendering — required for KaTeX math blocks ($inline$ and $$block$$)
npm install katex

# Diagram rendering — required for Mermaid diagram blocks
npm install mermaid
```

Features that depend on optional packages will simply not render if the package is not installed.

## Quick Start

```javascript
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { hybridMarkdown } from 'codemirror-for-writers';

const state = EditorState.create({
  doc: '# Hello World\n\nStart writing...',
  extensions: [
    hybridMarkdown({
      theme: 'light',
      enableWikiLinks: true,
      enableTags: true,
      wordCount: true,
    }),
  ],
});

const view = new EditorView({ state, parent: document.body });
```

## Features

Most advanced features are opt-in. Start with `hybridMarkdown()` defaults (hybrid preview + bottom toolbar enabled), then enable only what your app needs.

### Hybrid Preview
Unfocused lines render as formatted markdown (headings, bold, italic, links, images, code blocks, tables, task lists). Click a line to edit the raw markdown. Transitions are animated with smooth fade-ins.

### Collapsible Headings
Click the chevron next to any heading to collapse or expand the section beneath it.

### Inline Image Preview
`![alt](url)` lines render as actual images when unfocused. Click to edit the raw markdown.

### Wiki Links
`[[title]]`, `[[title|alias]]`, `[[title#section]]`, and `[[title#section|alias]]` are parsed and rendered as clickable links in preview. Provide an `onWikiLinkClick` handler to navigate.

### Tag System
`#tag` and `#tag/subtag` are rendered as styled pills in preview. Provide an `onTagClick` handler for click behavior.

### YAML Frontmatter Editor
YAML frontmatter blocks render as a structured key-value property table when unfocused. Click to edit raw YAML.

### Writing Modes
- **Typewriter Mode** — keeps the active line vertically centered as you type
- **Focus Mode** — dims all text except the current paragraph, with adjustable intensity (sentence, paragraph, or section level)
- **Writing Mode Sheet** — a unified panel to toggle typewriter and focus modes together

### Word Count Panel
Toggleable status bar showing live word count, character count, and estimated reading time.

### Backlinks Panel
Optional bottom panel showing incoming links to the current document. Enable with `backlinks: true` and provide async `onBacklinksRequested(title)` to load data from your app.

### Custom Task Types
Beyond standard `[x]` checkboxes, supports emoji-based task types: `[i]` info, `[!]` important, `[?]` question, `[*]` star, `[>]` forward, `[<]` schedule. Task types cycle on click.

### Bottom Toolbar
Mobile-friendly formatting toolbar at the bottom of the editor with undo/redo, text formatting, lists, and more. Enabled by default in `hybridMarkdown()`. Horizontally scrollable with overscroll containment to prevent browser navigation gestures.

### More Menu
Optional `⋯` menu extension in the top-right corner of the editor. You define all menu items (there is no built-in default item list). Checkmarks are controlled by each item's `getState(view)`.

### Additional
- Light and dark themes with dynamic switching
- Syntax-highlighted code blocks (JavaScript, Python, CSS, HTML, JSON)
- Math rendering with KaTeX (`$inline$` and `$$block$$`)
- Mermaid diagram rendering
- Emoji shortcodes (`:smile:` → 😄)
- Tables, blockquotes, horizontal rules
- Read-only mode (task toggles still work)
- Raw markdown mode toggle

## Keyboard Shortcuts

**Text Formatting**

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+B` | Bold |
| `Ctrl/Cmd+I` | Italic |
| `Ctrl/Cmd+Shift+X` | Strikethrough |
| `` Ctrl/Cmd+` `` | Inline code |
| `` Ctrl/Cmd+Shift+` `` | Code block |
| `Ctrl/Cmd+K` | Link |
| `Ctrl/Cmd+Shift+I` | Insert image |

**Headings**

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+1` | Heading 1 |
| `Ctrl/Cmd+2` | Heading 2 |
| `Ctrl/Cmd+3` | Heading 3 |

**Lists**

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+Shift+8` | Bullet list |
| `Ctrl/Cmd+Shift+7` | Numbered list |
| `Ctrl/Cmd+Shift+9` | Task list |

**Block Elements**

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+Shift+.` | Blockquote |

**Selection**

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+D` | Select next occurrence |
| `Ctrl/Cmd+Shift+L` | Select all occurrences |

**Search**

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+F` | Find (built-in) |
| `Ctrl/Cmd+H` | Find & Replace |

**Writing Modes**

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+Shift+T` | Toggle typewriter mode |
| `Ctrl/Cmd+Shift+F` | Toggle focus mode |

## API

### `hybridMarkdown(options?)`

Main extension function. Returns an array of CodeMirror extensions.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `'light' \| 'dark'` | `'light'` | Initial theme |
| `enablePreview` | `boolean` | `true` | Enable hybrid preview |
| `enableKeymap` | `boolean` | `true` | Enable markdown shortcuts |
| `enableCollapse` | `boolean` | `true` | Enable collapsible headings |
| `enableCustomTasks` | `boolean` | `false` | Enable custom task types |
| `customTaskTypes` | `string[]` | `['i','!','?','*','>','<']` | Custom task type order |
| `enableWikiLinks` | `boolean` | `false` | Enable wiki-link rendering |
| `renderWikiLinks` | `boolean` | `true` | Render wiki links in preview |
| `onWikiLinkClick` | `(link) => void` | — | Handler for wiki-link clicks |
| `enableTags` | `boolean` | `false` | Enable tag pill rendering |
| `onTagClick` | `(tag) => void` | — | Handler for tag clicks |
| `readOnly` | `boolean` | `false` | Read-only mode |
| `typewriter` | `boolean` | `false` | Typewriter mode |
| `focusMode` | `boolean` | `false` | Focus mode |
| `toolbar` | `boolean` | `true` | Show bottom formatting toolbar |
| `wordCount` | `boolean` | `false` | Show word count panel |
| `backlinks` | `boolean` | `false` | Show backlinks panel (typically used with `onBacklinksRequested`) |
| `docTitle` | `string` | — | Document title for backlinks (falls back to frontmatter `title`) |
| `onBacklinksRequested` | `(title) => Promise<Array>` | — | Async resolver returning backlinks data |
| `onBacklinkClick` | `(backlink) => void` | — | Handler for backlink clicks |
| `frontmatterKeys` | `string[]` | — | Known frontmatter keys for autocomplete in the properties sheet |

### Runtime Toggle Functions

All toggle functions accept an `EditorView` and return the new state.

```javascript
import {
  toggleTheme, setTheme, getTheme,
  toggleHybridMode, setMode, getMode,
  toggleReadOnly, setReadOnly, isReadOnly,
  toggleTypewriter, setTypewriter, isTypewriter,
  toggleFocusMode, setFocusMode, isFocusMode,
  toggleToolbar, setToolbar, isToolbar,
  toggleWordCount, setWordCount, isWordCount,
  toggleBacklinks, setBacklinks, isBacklinks,
  toggleFrontmatterSheet, setFrontmatterSheet, isFrontmatterSheet,
} from 'codemirror-for-writers';

toggleTheme(view);              // returns true if now dark
toggleHybridMode(view);         // returns true if now hybrid
toggleReadOnly(view);           // returns true if now read-only
toggleTypewriter(view);         // returns true if now enabled
toggleFocusMode(view);          // returns true if now enabled
toggleToolbar(view);            // returns true if now shown
toggleWordCount(view);          // returns true if now shown
toggleBacklinks(view);          // returns true if now shown
toggleFrontmatterSheet(view);   // returns true if now open
```

### `bottomToolbar(options?)`

Bottom formatting toolbar. Returns an array of CodeMirror extensions.
`hybridMarkdown()` already includes this toolbar by default. Use `toolbar: false` to disable it, or add `bottomToolbar(...)` manually only when you want custom button configuration outside the default setup.

```javascript
import { bottomToolbar } from 'codemirror-for-writers';

bottomToolbar();

// With custom extra buttons
bottomToolbar({
  extraButtons: [
    { icon: '⚙', title: 'Settings', handler: (view) => { /* ... */ } },
  ],
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `buttons` | `Array` | built-in set | Override the default button set |
| `extraButtons` | `Array<{icon, title, handler}>` | `[]` | Additional buttons appended after defaults |

### `moreMenu(options?)`

Dropdown menu button (⋯) positioned top-right of the editor. Returns an array of CodeMirror extensions.
No menu items are added unless you provide them in `items`.

```javascript
import { moreMenu, toggleTheme, getTheme, toggleToolbar, isToolbar } from 'codemirror-for-writers';

moreMenu({
  items: [
    { label: 'Dark mode', handler: (v) => toggleTheme(v), getState: (v) => getTheme(v) === 'dark' },
    { label: 'Toolbar', handler: (v) => toggleToolbar(v), getState: (v) => isToolbar(v) },
  ],
});
```

| Option | Type | Description |
|--------|------|-------------|
| `items` | `Array<{label, handler, getState?}>` | Menu items. `handler(view)` is called on click. `getState(view)` returns `true` to show a checkmark. |

### Actions

Formatting functions for building custom toolbars:

```javascript
import { actions } from 'codemirror-for-writers';

// Text formatting
actions.bold(view);
actions.italic(view);
actions.strikethrough(view);
actions.inlineCode(view);

// Block elements
actions.h1(view);  actions.h2(view);  actions.h3(view);
actions.quote(view);
actions.codeBlock(view);
actions.hr(view);
actions.table(view);
actions.diagram(view);

// Lists
actions.bulletList(view);
actions.numberedList(view);
actions.taskList(view);

// Insertions
actions.link(view);
actions.image(view);
actions.emoji(view);

// Edit operations
actions.undo(view);
actions.redo(view);
actions.search(view);
actions.replace(view);
actions.selectNextOccurrence(view);
actions.selectAllOccurrences(view);
```

### Wiki Link Autocomplete

```javascript
import { autocompletion } from '@codemirror/autocomplete';
import { hybridMarkdown, createNoteIndex, wikiLinkAutocomplete } from 'codemirror-for-writers';

const notes = [
  { title: 'My Note', aliases: ['alias1'] },
  { title: 'Another Note' },
];

const noteIndex = createNoteIndex(notes);

const state = EditorState.create({
  doc: '',
  extensions: [
    hybridMarkdown({ enableWikiLinks: true }),
    autocompletion({ override: [wikiLinkAutocomplete({ noteIndex })] }),
  ],
});
```

### Tag Autocomplete

```javascript
import { autocompletion } from '@codemirror/autocomplete';
import { hybridMarkdown, tagAutocomplete } from 'codemirror-for-writers';

const state = EditorState.create({
  doc: '',
  extensions: [
    hybridMarkdown({ enableTags: true }),
    autocompletion({
      override: [tagAutocomplete({ tags: ['writing', 'draft', 'ideas/new'] })],
    }),
  ],
});
```

### Backlinks

```javascript
import { hybridMarkdown } from 'codemirror-for-writers';

const state = EditorState.create({
  doc: '---\ntitle: My Document\n---\n\nContent here.',
  extensions: [
    hybridMarkdown({
      backlinks: true,
      onBacklinksRequested: async (title) => {
        // Fetch from your app's data store
        return [
          { title: 'Linking Note', excerpt: 'References this document...' },
        ];
      },
      onBacklinkClick: (backlink) => {
        // Navigate to the linking document
        console.log('Navigate to:', backlink.title);
      },
    }),
  ],
});
```

## Publishing

```bash
npm login
npm publish
```

The `prepublishOnly` script runs `npm run build:lib` automatically before publishing.

## License

MIT
