# Enhanced CodeMirror Markdown Hybrid Editor

A powerful CodeMirror 6 extension for hybrid markdown editing with **wiki-links**, **YAML frontmatter**, **custom task types**, and **extended markdown features**.

Forked from [tiagosimoes/codemirror-markdown-hybrid](https://github.com/tiagosimoes/codemirror-markdown-hybrid) with significant enhancements for personal knowledge management and note-taking apps.

## ✨ Features

### 🔗 Wiki Links
- Parse and render `[[Wiki Link]]` syntax
- Support display text: `[[Target|Display Text]]`
- Click handler for navigation
- Hover preview (customizable)

### 📋 YAML Frontmatter
- Separate panel for editing document properties
- Hidden from main editor view
- YAML validation
- Change callbacks for sync
- Keyboard shortcut: `Cmd+Shift+P`

### ✅ Custom Task Types
Beyond standard `[ ]` and `[x]` checkboxes:
- `[!]` - Urgent (red ⚠️)
- `[>]` - Forwarded (blue ➡️)
- `[<]` - Scheduled (orange 📅)
- `[?]` - Question (purple ❓)
- `[i]` - Information (blue ℹ️)
- `[*]` - Important (pink ⭐)

**Click to cycle** through task types in preview mode!

### 📝 Extended Markdown
Based on [markdown guide](https://www.markdownguide.org/extended-syntax/):
- `==highlighted text==` - Highlighting
- `~subscript~` - Subscript
- `^superscript^` - Superscript
- `[^1]` - Footnote references
- `[^1]: definition` - Footnote definitions
- `~~strikethrough~~` - Strikethrough (GFM)

### 🎨 Hybrid Preview
- Rendered markdown for unfocused lines
- Raw markdown for the active line
- Smooth transitions
- Collapsible headings

### 🎹 Keyboard Shortcuts
- `Cmd+B` - Bold
- `Cmd+I` - Italic
- `Cmd+Shift+X` - Strikethrough
- `Cmd+Shift+H` - Highlight
- `Cmd+E` - Inline code
- `Cmd+K` - Link
- `Cmd+Shift+K` - Wiki link
- `Cmd+Alt+1/2/3` - Headings
- `Cmd+Shift+L` - Bullet list
- `Cmd+Shift+O` - Numbered list
- `Cmd+Shift+T` - Task list
- `Cmd+Shift+C` - Code block
- `Cmd+Shift+Q` - Quote
- `Cmd+Shift+P` - Properties panel

## 📦 Installation

```bash
npm install codemirror-for-writers @codemirror/state @codemirror/view
```

## 🚀 Usage

```typescript
import { EditorView, basicSetup } from 'codemirror';
import { hybridMarkdown } from 'codemirror-for-writers';

const view = new EditorView({
  doc: '# Hello World',
  extensions: [
    basicSetup,
    hybridMarkdown({
      theme: 'light',
      enableWikiLinks: true,
      enableYamlFrontmatter: true,
      enableExtendedMarkdown: true,
      enableCustomTasks: true,
      customTaskTypes: ['!', '>', '<', '?', 'i', '*'],
      onWikiLinkClick: (link) => {
        // Navigate to wiki page
        console.log('Navigate to:', link.title, link.section);
      },
      onFrontmatterChange: (data) => {
        // Sync frontmatter data
        console.log('Frontmatter:', data);
      },
    }),
  ],
  parent: document.body,
});
```

## ⚙️ Configuration

### `HybridMarkdownOptions`

```typescript
interface HybridMarkdownOptions {
  theme?: 'light' | 'dark';              // Default: 'light'
  enablePreview?: boolean;                // Default: true
  enableKeymap?: boolean;                 // Default: true
  enableCollapse?: boolean;               // Default: true
  enableWikiLinks?: boolean;              // Default: false
  renderWikiLinks?: boolean;              // Default: true
  enableYamlFrontmatter?: boolean;        // Default: true
  enableExtendedMarkdown?: boolean;       // Default: true
  enableCustomTasks?: boolean;            // Default: true
  customTaskTypes?: string[];             // Default: ['!', '>', '<', '?', 'i', '*']
  onWikiLinkClick?: (link: { raw: string; title: string; section: string; alias: string; display: string }) => void;
  onFrontmatterChange?: (frontmatter: Record<string, any>) => void;
}
```

## 🛠️ API

### Theme Functions
```typescript
import { toggleTheme, setTheme } from 'codemirror-for-writers';

toggleTheme(view);           // Returns true if now dark
setTheme(view, 'dark');      // Set explicitly
```

### Mode Functions
```typescript
import { toggleHybridMode, setMode } from 'codemirror-for-writers';

toggleHybridMode(view);      // Returns true if hybrid
setMode(view, 'raw');        // Show raw markdown
```

### Actions (for toolbars)
```typescript
import { actions } from 'codemirror-for-writers';

// Basic formatting
actions.bold(view);
actions.italic(view);
actions.strikethrough(view);
actions.highlight(view);
actions.inlineCode(view);
actions.subscript(view);
actions.superscript(view);

// Headings
actions.heading1(view);
actions.heading2(view);
actions.heading3(view);

// Links
actions.link(view);
actions.wikiLink(view);
actions.image(view);

// Lists
actions.bulletList(view);
actions.numberedList(view);
actions.taskList(view);

// Custom tasks
actions.urgentTask(view);        // [!]
actions.forwardedTask(view);     // [>]
actions.scheduledTask(view);     // [<]
actions.questionTask(view);      // [?]
actions.infoTask(view);          // [i]
actions.importantTask(view);     // [*]

// Other
actions.codeBlock(view);
actions.quote(view);
actions.horizontalRule(view);
actions.table(view, 3, 3);       // rows, cols
actions.footnote(view);
actions.insertFrontmatter(view);
```

## 🎯 Use Cases

### Personal Knowledge Base (Obsidian-style)
```typescript
hybridMarkdown({
  enableWikiLinks: true,
  onWikiLinkClick: (link) => {
    router.push(`/notes/${link.title}`);
  },
})
```

### Task Management (with custom types)
```typescript
hybridMarkdown({
  enableCustomTasks: true,
  customTaskTypes: ['!', '>', '<'],
  onFrontmatterChange: (data) => {
    // Sync task metadata
    updateTaskPriority(data.priority);
  },
})
```

### Blog/CMS Editor
```typescript
hybridMarkdown({
  enableYamlFrontmatter: true,
  onFrontmatterChange: (data) => {
    // Save post metadata
    savePostMeta({
      title: data.title,
      date: data.date,
      tags: data.tags,
    });
  },
})
```

## 🎨 Custom Styling

The editor uses CSS custom properties for theming:

```css
.cm-editor {
  --cm-wiki-link-color: #0066cc;
  --cm-wiki-link-hover-bg: #0066cc10;
  --cm-highlight-bg: #ffeb3b80;
  --cm-panel-bg: #f5f5f5;
  /* ... and more */
}
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Run demo
npm run dev

# Build library
npm run build:lib

# Run tests
npm test
```

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- Original project by [tiagosimoes](https://github.com/tiagosimoes)
- Inspired by Bear, iA Writer, and Obsidian
- Built with CodeMirror 6

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built for mobile-first, offline-first personal OS and note-taking applications.**
