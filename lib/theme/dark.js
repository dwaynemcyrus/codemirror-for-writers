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

  // Footnotes
  '.footnote-ref .footnote-link': { color: '#228be6' },
  '.footnote-def': { color: '#aaa' },
  '.footnote-def sup': { color: '#228be6' },
  '.md-wikilink, .cm-wikilink': { color: '#228be6' },
});
