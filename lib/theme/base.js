import { EditorView } from '@codemirror/view';

/**
 * Base theme with all required styles for the hybrid markdown preview
 * These styles are bundled with the extension
 */
export const baseTheme = EditorView.baseTheme({
  // Editor base
  '&': {
    height: '100%',
    fontSize: '16px',
  },
  '.cm-content': {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: '20px',
    lineHeight: '1.6',
  },
  '.cm-line': {
    padding: '2px 0',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  '&.cm-focused': {
    outline: 'none',
  },

  // Markdown preview container
  '.cm-markdown-preview': {
    display: 'inline',
    transition: 'opacity 0.1s ease',
  },

  // Headers
  '.cm-markdown-preview .md-header': {
    display: 'inline',
    fontWeight: '600',
    lineHeight: '1.4',
  },
  '.cm-markdown-preview .md-h1': {
    fontSize: '2em',
  },
  '.cm-markdown-preview .md-h2': {
    fontSize: '1.5em',
  },
  '.cm-markdown-preview .md-h3': {
    fontSize: '1.25em',
  },
  '.cm-markdown-preview .md-h4': {
    fontSize: '1.1em',
  },
  '.cm-markdown-preview .md-h5': {
    fontSize: '1em',
  },
  '.cm-markdown-preview .md-h6': {
    fontSize: '0.9em',
  },

  // Bold and italic
  '.cm-markdown-preview strong': {
    fontWeight: '700',
  },
  '.cm-markdown-preview em': {
    fontStyle: 'italic',
  },
  '.cm-markdown-preview del': {
    textDecoration: 'line-through',
  },

  // Inline code
  '.cm-markdown-preview code': {
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: '0.9em',
  },

  // Links
  '.cm-markdown-preview a': {
    textDecoration: 'none',
    cursor: 'pointer',
  },
  '.cm-markdown-preview a:hover': {
    textDecoration: 'underline',
  },

  // Images
  '.cm-markdown-preview img': {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '4px',
  },

  // Blockquotes
  '.cm-markdown-preview .md-blockquote': {
    display: 'inline',
    fontStyle: 'italic',
    paddingLeft: '12px',
    marginLeft: '0',
  },

  // List items
  '.cm-markdown-preview .md-list-item': {
    display: 'inline',
  },
  '.cm-markdown-preview .md-list-marker': {
    marginRight: '4px',
  },

  // Horizontal rule
  '.cm-markdown-preview .md-hr, .cm-markdown-preview hr': {
    display: 'block',
    border: 'none',
    margin: '8px 0',
  },

  // Checkboxes
  '.cm-markdown-preview input[type="checkbox"]': {
    marginRight: '6px',
    cursor: 'pointer',
  },

  // Code block lines
  '.cm-code-block-line': {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: '0.9em',
  },

  // Highlighted code
  '.cm-highlighted-code': {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
  },

  // Table preview container
  '.cm-table-preview': {
    display: 'block',
    margin: '0',
  },

  // Table styling
  '.md-table': {
    borderCollapse: 'collapse',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  '.md-table th, .md-table td': {
    padding: '8px 12px',
    textAlign: 'left',
  },
  '.md-table th': {
    fontWeight: '600',
  },

  // Legacy single-line table styles
  '.cm-markdown-preview .md-table-row': {
    display: 'inline-flex',
    borderRadius: '4px',
  },
  '.cm-markdown-preview .md-table-cell': {
    display: 'inline-block',
    padding: '6px 12px',
    minWidth: '80px',
  },
  '.cm-markdown-preview .md-table-cell:last-child': {
    borderRight: 'none',
  },
  '.cm-markdown-preview .md-table-separator': {
    display: 'none',
  },

  // Math block preview
  '.cm-math-preview': {
    display: 'block',
    padding: '8px 0',
  },
  '.cm-math-preview .katex-display': {
    textAlign: 'left !important',
    margin: '0 !important',
    justifyContent: 'flex-start !important',
  },
  '.cm-math-preview .katex-display > .katex': {
    textAlign: 'left !important',
  },

  // Mermaid diagram preview
  '.cm-mermaid-preview': {
    display: 'block',
    padding: '16px 0',
    cursor: 'pointer',
  },
  '.cm-mermaid-preview svg': {
    maxWidth: '100%',
    height: 'auto',
  },
  '.cm-mermaid-preview .mermaid-error': {
    color: '#d73a49',
    fontFamily: 'monospace',
    fontSize: '0.9em',
  },
  '.cm-mermaid-block-line': {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: '0.9em',
  },

  // Footnotes
  '.footnote-ref .footnote-link': {
    cursor: 'pointer',
    fontSize: '0.85em',
  },
  '.footnote-def': {
    display: 'inline',
    fontSize: '0.9em',
  },
  '.footnote-def sup': {
    marginRight: '4px',
  },

  // Syntax highlighting (base classes)
  '.tok-keyword': {},
  '.tok-operator': {},
  '.tok-variableName': {},
  '.tok-function, .tok-definition': {},
  '.tok-string, .tok-string2': {},
  '.tok-number': {},
  '.tok-bool, .tok-null': {},
  '.tok-comment': { fontStyle: 'italic' },
  '.tok-punctuation': {},
  '.tok-propertyName': {},
  '.tok-typeName, .tok-className': {},
  '.tok-tagName': {},
  '.tok-attributeName': {},
  '.tok-attributeValue': {},
  '.tok-regexp': {},
  '.tok-meta': {},
});
