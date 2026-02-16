import { EditorView } from '@codemirror/view';

/**
 * Dark theme for the hybrid markdown editor
 */
export const darkTheme = EditorView.theme({
  // Editor background
  '&': {
    backgroundColor: '#1e1e1e',
  },
  '.cm-content': {
    caretColor: '#fff',
    color: '#d4d4d4',
  },
  '.cm-cursor': {
    borderLeftColor: '#fff',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#264f78',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#264f78',
  },

  // Header colors
  '.cm-markdown-preview .md-h1': { color: '#e8e8ec' },
  '.cm-markdown-preview .md-h2': { color: '#d5d5db' },
  '.cm-markdown-preview .md-h3': { color: '#c2c2ca' },
  '.cm-markdown-preview .md-h4': { color: '#acacb8' },
  '.cm-markdown-preview .md-h5': { color: '#9696a4' },
  '.cm-markdown-preview .md-h6': { color: '#808090' },

  // Text colors
  '.cm-markdown-preview del': { color: '#777' },
  '.cm-markdown-preview code': {
    backgroundColor: '#2d2d2d',
    color: '#ce9178',
  },
  '.cm-markdown-preview a': { color: '#228be6' },
  '.cm-markdown-preview .md-blockquote': {
    color: '#aaa',
    borderLeft: '3px solid #4a4a5a',
  },
  '.cm-markdown-preview .md-list-marker': { color: '#888' },
  '.cm-markdown-preview .md-hr, .cm-markdown-preview hr': {
    background: 'linear-gradient(to right, transparent, #4a4a5a, transparent)',
  },

  // Code block lines
  '.cm-code-block-line': {
    backgroundColor: '#2d2d2d !important',
    borderLeft: '3px solid #444',
  },
  '.cm-code-block-line.cm-code-block-focused': {
    backgroundColor: '#3a3d41 !important',
    borderLeft: '3px solid #569cd6',
  },

  // Selected lines get light styling (inverted)
  '.cm-selectedLine, .cm-table-line, .cm-math-block-line, .cm-mermaid-block-line': {
    backgroundColor: '#fff !important',
    color: '#1e1e1e !important',
    caretColor: '#333 !important',
    borderRadius: '4px',
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: '0.90em',
  },
  '.cm-selectedLine.cm-code-block-line': {
    backgroundColor: '#fff !important',
    borderLeft: '3px solid #228be6',
    color: '#1e1e1e !important',
    caretColor: '#333 !important',
    borderRadius: '0',
  },

  // Syntax highlighting for selected code block lines (light theme colors)
  '.cm-selectedLine.cm-code-block-line .tok-keyword': { color: '#d73a49 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-operator': { color: '#d73a49 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-variableName': { color: '#24292e !important' },
  '.cm-selectedLine.cm-code-block-line .tok-function, .cm-selectedLine.cm-code-block-line .tok-definition': { color: '#6f42c1 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-string, .cm-selectedLine.cm-code-block-line .tok-string2': { color: '#032f62 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-number': { color: '#005cc5 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-bool, .cm-selectedLine.cm-code-block-line .tok-null': { color: '#005cc5 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-comment': { color: '#6a737d !important' },
  '.cm-selectedLine.cm-code-block-line .tok-punctuation': { color: '#24292e !important' },
  '.cm-selectedLine.cm-code-block-line .tok-propertyName': { color: '#005cc5 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-typeName, .cm-selectedLine.cm-code-block-line .tok-className': { color: '#22863a !important' },
  '.cm-selectedLine.cm-code-block-line .tok-tagName': { color: '#22863a !important' },
  '.cm-selectedLine.cm-code-block-line .tok-attributeName': { color: '#6f42c1 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-attributeValue': { color: '#032f62 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-regexp': { color: '#032f62 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-meta': { color: '#6a737d !important' },

  // Inline image preview
  '.cm-image-preview img': {
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
  },
  '.cm-image-alt': {
    color: '#888',
  },
  '.cm-image-error': {
    backgroundColor: '#3a2020',
    color: '#f48771',
    border: '1px solid #5a3030',
  },

  // Frontmatter property editor
  '.cm-frontmatter-preview': {
    backgroundColor: '#2d2d2d',
    border: '1px solid #444',
  },
  '.cm-frontmatter-table td': {
    borderBottom: '1px solid #3c3c3c',
  },
  '.cm-frontmatter-table tr:last-child td': {
    borderBottom: 'none',
  },
  '.cm-frontmatter-key': {
    color: '#9cdcfe',
  },
  '.cm-frontmatter-input': {
    color: '#d4d4d4',
  },
  '.cm-frontmatter-key-input:focus': {
    backgroundColor: '#3a3d41',
    boxShadow: '0 0 0 1px #569cd6',
  },
  '.cm-frontmatter-input:focus': {
    backgroundColor: '#3a3d41',
    boxShadow: '0 0 0 1px #569cd6',
  },
  '.cm-frontmatter-tag': {
    backgroundColor: '#264f78',
    color: '#9cdcfe',
    border: '1px solid #3a6ea5',
  },
  '.cm-frontmatter-add-tag': {
    backgroundColor: '#264f78',
    color: '#9cdcfe',
  },
  '.cm-frontmatter-delete': {
    color: '#f48771',
  },
  '.cm-frontmatter-error': {
    color: '#f48771',
  },
  '.cm-frontmatter-line': {
    backgroundColor: '#2d2d2d !important',
    borderLeft: '3px solid #444',
  },

  // Frontmatter sheet overlay
  '.cm-frontmatter-sheet-backdrop': {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  '.cm-frontmatter-sheet': {
    backgroundColor: '#252526',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
  },
  '.cm-frontmatter-sheet-title': {
    color: '#d4d4d4',
  },
  '.cm-frontmatter-sheet-close': {
    color: '#aaa',
  },
  '.cm-frontmatter-sheet-add-btn': {
    backgroundColor: '#3c3c3c',
    borderColor: '#555',
    color: '#d4d4d4',
  },
  '.cm-frontmatter-sheet-add-btn:hover': {
    backgroundColor: '#4a4a4a',
  },

  // Word count panel
  '.cm-word-count-panel': {
    backgroundColor: '#252526',
    borderTop: '1px solid #3c3c3c',
    color: '#aaa',
  },
  '.cm-word-count-value': {
    color: '#d4d4d4',
  },
  '.cm-word-count-label': {
    color: '#777',
  },
  '.cm-word-count-divider': {
    backgroundColor: '#444',
  },
  '.cm-word-count-selection': {
    color: '#569cd6',
  },
  '.cm-word-count-selection .cm-word-count-value': {
    color: '#569cd6',
  },
  '.cm-word-count-selection .cm-word-count-label': {
    color: '#569cd6',
    opacity: '0.7',
  },

  // Gutters
  '.cm-gutters': {
    background: '#252526',
    borderRight: '1px solid #3c3c3c',
  },

  // Table styling
  '.md-table': { border: '1px solid #444' },
  '.md-table th, .md-table td': { border: '1px solid #444' },
  '.md-table th': { background: '#2d2d2d' },
  '.md-table tbody tr:hover': { background: '#2d2d2d' },
  '.cm-markdown-preview .md-table-row': {
    background: '#1e1e1e',
    border: '1px solid #444',
  },
  '.cm-markdown-preview .md-table-cell': {
    borderRight: '1px solid #444',
  },

  // Syntax highlighting (dark theme colors)
  '.tok-keyword': { color: '#569cd6' },
  '.tok-operator': { color: '#d4d4d4' },
  '.tok-variableName': { color: '#9cdcfe' },
  '.tok-function, .tok-definition': { color: '#dcdcaa' },
  '.tok-string, .tok-string2': { color: '#ce9178' },
  '.tok-number': { color: '#b5cea8' },
  '.tok-bool, .tok-null': { color: '#569cd6' },
  '.tok-comment': { color: '#6a9955' },
  '.tok-punctuation': { color: '#d4d4d4' },
  '.tok-propertyName': { color: '#9cdcfe' },
  '.tok-typeName, .tok-className': { color: '#4ec9b0' },
  '.tok-tagName': { color: '#569cd6' },
  '.tok-attributeName': { color: '#9cdcfe' },
  '.tok-attributeValue': { color: '#ce9178' },
  '.tok-regexp': { color: '#d16969' },
  '.tok-meta': { color: '#6a9955' },

  // Backlinks panel
  '.cm-backlinks-panel': {
    backgroundColor: '#252526',
    borderTop: '1px solid #3c3c3c',
    color: '#aaa',
  },
  '.cm-backlinks-label': {
    color: '#d4d4d4',
  },
  '.cm-backlinks-link': {
    backgroundColor: '#264f78',
    color: '#9cdcfe',
    border: '1px solid #3a6ea5',
  },

  // Tag pills
  '.md-tag': {
    backgroundColor: '#1b3a1b',
    color: '#81c784',
    border: '1px solid #2e5a2e',
  },
  '.cm-tag-mark': {
    color: '#81c784',
  },

  // Footnotes
  '.footnote-ref .footnote-link': { color: '#228be6' },
  '.footnote-def': { color: '#aaa' },
  '.footnote-def sup': { color: '#228be6' },
  '.md-wikilink, .cm-wikilink': { color: '#228be6' },
});
