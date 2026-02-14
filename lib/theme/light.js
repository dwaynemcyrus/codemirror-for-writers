import { EditorView } from '@codemirror/view';

/**
 * Light theme for the hybrid markdown editor
 */
export const lightTheme = EditorView.theme({
  // Editor background
  '&': {
    backgroundColor: '#fff',
  },
  '.cm-content': {
    caretColor: '#333',
  },
  '.cm-cursor': {
    borderLeftColor: '#333',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#b4d5fe',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#b4d5fe',
  },

  // Header colors
  '.cm-markdown-preview .md-h1': { color: '#1a1a2e' },
  '.cm-markdown-preview .md-h2': { color: '#2d2d3f' },
  '.cm-markdown-preview .md-h3': { color: '#3d3d4d' },
  '.cm-markdown-preview .md-h4': { color: '#555566' },
  '.cm-markdown-preview .md-h5': { color: '#666677' },
  '.cm-markdown-preview .md-h6': { color: '#777788' },

  // Text colors
  '.cm-markdown-preview del': { color: '#868e96' },
  '.cm-markdown-preview code': {
    backgroundColor: '#f1f3f5',
    color: '#e83e8c',
  },
  '.cm-markdown-preview a': { color: '#228be6' },
  '.cm-markdown-preview .md-blockquote': {
    color: '#555',
    borderLeft: '3px solid #c0c8d0',
  },
  '.cm-markdown-preview .md-list-marker': { color: '#888' },
  '.cm-markdown-preview .md-hr, .cm-markdown-preview hr': {
    background: 'linear-gradient(to right, transparent, #c0c8d0, transparent)',
  },

  // Code block lines
  '.cm-code-block-line': {
    backgroundColor: '#f6f8fa !important',
    borderLeft: '3px solid #e1e4e8',
  },
  '.cm-code-block-line.cm-code-block-focused': {
    backgroundColor: '#e8f4fc !important',
    borderLeft: '3px solid #228be6',
  },

  // Selected lines get dark styling (inverted)
  '.cm-selectedLine, .cm-table-line, .cm-math-block-line, .cm-mermaid-block-line': {
    backgroundColor: '#1e1e1e !important',
    color: '#d4d4d4 !important',
    caretColor: '#fff !important',
    borderRadius: '4px',
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: '0.90em',
  },
  '.cm-selectedLine.cm-code-block-line': {
    backgroundColor: '#1e1e1e !important',
    borderLeft: '3px solid #569cd6',
    color: '#d4d4d4 !important',
    caretColor: '#fff !important',
    borderRadius: '0',
  },

  // Syntax highlighting for selected code block lines (dark theme colors)
  '.cm-selectedLine.cm-code-block-line .tok-keyword': { color: '#569cd6 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-operator': { color: '#d4d4d4 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-variableName': { color: '#9cdcfe !important' },
  '.cm-selectedLine.cm-code-block-line .tok-function, .cm-selectedLine.cm-code-block-line .tok-definition': { color: '#dcdcaa !important' },
  '.cm-selectedLine.cm-code-block-line .tok-string, .cm-selectedLine.cm-code-block-line .tok-string2': { color: '#ce9178 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-number': { color: '#b5cea8 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-bool, .cm-selectedLine.cm-code-block-line .tok-null': { color: '#569cd6 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-comment': { color: '#6a9955 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-punctuation': { color: '#d4d4d4 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-propertyName': { color: '#9cdcfe !important' },
  '.cm-selectedLine.cm-code-block-line .tok-typeName, .cm-selectedLine.cm-code-block-line .tok-className': { color: '#4ec9b0 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-tagName': { color: '#569cd6 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-attributeName': { color: '#9cdcfe !important' },
  '.cm-selectedLine.cm-code-block-line .tok-attributeValue': { color: '#ce9178 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-regexp': { color: '#d16969 !important' },
  '.cm-selectedLine.cm-code-block-line .tok-meta': { color: '#6a9955 !important' },

  // Inline image preview
  '.cm-image-preview img': {
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
  },
  '.cm-image-alt': {
    color: '#888',
  },
  '.cm-image-error': {
    backgroundColor: '#fff3f3',
    color: '#d73a49',
    border: '1px solid #fdd',
  },

  // Frontmatter property editor
  '.cm-frontmatter-preview': {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e1e4e8',
  },
  '.cm-frontmatter-table td': {
    borderBottom: '1px solid #eee',
  },
  '.cm-frontmatter-table tr:last-child td': {
    borderBottom: 'none',
  },
  '.cm-frontmatter-key': {
    color: '#555',
  },
  '.cm-frontmatter-input:focus': {
    backgroundColor: '#fff',
    boxShadow: '0 0 0 1px #228be6',
  },
  '.cm-frontmatter-tag': {
    backgroundColor: '#e8f0fe',
    color: '#1a73e8',
    border: '1px solid #d2e3fc',
  },
  '.cm-frontmatter-add-tag': {
    backgroundColor: '#e8f0fe',
    color: '#1a73e8',
  },
  '.cm-frontmatter-delete': {
    color: '#d73a49',
  },
  '.cm-frontmatter-error': {
    color: '#d73a49',
  },
  '.cm-frontmatter-line': {
    backgroundColor: '#f6f8fa !important',
    borderLeft: '3px solid #e1e4e8',
  },

  // Word count panel
  '.cm-word-count-panel': {
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e1e4e8',
    color: '#555',
  },
  '.cm-word-count-value': {
    color: '#333',
  },
  '.cm-word-count-label': {
    color: '#888',
  },
  '.cm-word-count-divider': {
    backgroundColor: '#dee2e6',
  },
  '.cm-word-count-selection': {
    color: '#228be6',
  },
  '.cm-word-count-selection .cm-word-count-value': {
    color: '#228be6',
  },
  '.cm-word-count-selection .cm-word-count-label': {
    color: '#228be6',
    opacity: '0.7',
  },

  // Gutters
  '.cm-gutters': {
    background: '#f8f9fa',
    borderRight: '1px solid #dee2e6',
  },

  // Table styling
  '.md-table': { border: '1px solid #d0d7de' },
  '.md-table th, .md-table td': { border: '1px solid #d0d7de' },
  '.md-table th': { background: '#f6f8fa' },
  '.md-table tbody tr:hover': { background: '#f6f8fa' },
  '.cm-markdown-preview .md-table-row': {
    background: '#fff',
    border: '1px solid #d0d7de',
  },
  '.cm-markdown-preview .md-table-cell': {
    borderRight: '1px solid #d0d7de',
  },

  // Syntax highlighting (light theme colors)
  '.tok-keyword': { color: '#d73a49' },
  '.tok-operator': { color: '#d73a49' },
  '.tok-variableName': { color: '#24292e' },
  '.tok-function, .tok-definition': { color: '#6f42c1' },
  '.tok-string, .tok-string2': { color: '#032f62' },
  '.tok-number': { color: '#005cc5' },
  '.tok-bool, .tok-null': { color: '#005cc5' },
  '.tok-comment': { color: '#6a737d' },
  '.tok-punctuation': { color: '#24292e' },
  '.tok-propertyName': { color: '#005cc5' },
  '.tok-typeName, .tok-className': { color: '#22863a' },
  '.tok-tagName': { color: '#22863a' },
  '.tok-attributeName': { color: '#6f42c1' },
  '.tok-attributeValue': { color: '#032f62' },
  '.tok-regexp': { color: '#032f62' },
  '.tok-meta': { color: '#6a737d' },

  // Footnotes
  '.footnote-ref .footnote-link': { color: '#228be6' },
  '.footnote-def': { color: '#666' },
  '.footnote-def sup': { color: '#228be6' },
  '.md-wikilink, .cm-wikilink': { color: '#228be6' },
});
