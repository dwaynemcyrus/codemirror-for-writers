import { EditorView } from '@codemirror/view';

// Inject @keyframes for smooth preview transitions (not supported by EditorView.baseTheme)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = '@keyframes cmFadeIn { from { opacity: 0 } to { opacity: 1 } }';
  document.head.appendChild(style);
}

/**
 * Base theme with all required styles for the hybrid markdown preview
 * These styles are bundled with the extension
 */
export const baseTheme = EditorView.baseTheme({
  // Editor base
  '&': {
    height: '100%',
    fontSize: '17px',
  },
  '.cm-content': {
    fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
    padding: '20px 48px',
    lineHeight: '1.75',
  },
  '.cm-line': {
    padding: '4px 0',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
  },
  '&.cm-focused': {
    outline: 'none',
  },

  // Markdown preview container
  '.cm-markdown-preview': {
    display: 'inline',
    animation: 'cmFadeIn 0.12s ease-out',
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
  '.cm-markdown-preview .md-highlight, .cm-markdown-preview mark': {
    backgroundColor: '#fde68a',
    color: 'inherit',
    padding: '0 2px',
    borderRadius: '3px',
  },
  '.cm-markdown-preview .md-subscript, .cm-markdown-preview sub': {
    fontSize: '0.85em',
    verticalAlign: 'sub',
  },
  '.cm-markdown-preview .md-superscript, .cm-markdown-preview sup': {
    fontSize: '0.85em',
    verticalAlign: 'super',
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
    paddingLeft: '16px',
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
    margin: '16px 0',
    height: '1px',
  },

  // Checkboxes
  '.cm-markdown-preview input[type="checkbox"]': {
    width: '19.2px',
    height: '19.2px',
    marginRight: '6px',
    cursor: 'pointer',
  },
  '.cm-markdown-preview .md-task-icon': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.2em',
    marginRight: '6px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  '.cm-markdown-preview .md-task-idea': {
    color: '#0ea5e9',
  },
  '.cm-markdown-preview .md-task-urgent': {
    color: '#ef4444',
  },
  '.cm-markdown-preview .md-task-question': {
    color: '#a855f7',
  },
  '.cm-markdown-preview .md-task-important': {
    color: '#ec4899',
  },
  '.cm-markdown-preview .md-task-forwarded': {
    color: '#3b82f6',
  },
  '.cm-markdown-preview .md-task-scheduled': {
    color: '#f59e0b',
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
    animation: 'cmFadeIn 0.15s ease-out',
  },

  // Definition list preview
  '.cm-definition-list-preview': {
    display: 'block',
    margin: '0',
    animation: 'cmFadeIn 0.15s ease-out',
  },
  '.md-definition-list': {
    margin: '4px 0 8px 0',
  },
  '.md-definition-list dt': {
    fontWeight: '600',
  },
  '.md-definition-list dd': {
    margin: '2px 0 6px 16px',
  },

  // Footnote preview
  '.cm-footnote-preview': {
    display: 'block',
    margin: '4px 0',
    animation: 'cmFadeIn 0.15s ease-out',
  },
  '.md-footnote-block': {
    display: 'block',
  },
  '.md-footnote-line': {
    display: 'block',
  },
  '.md-footnote-backref': {
    display: 'block',
  },
  '.md-footnote-backref-link': {
    cursor: 'pointer',
    fontSize: '0.85em',
  },
  '.md-wikilink': {
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
  },
  '.cm-wikilink': {
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
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
    animation: 'cmFadeIn 0.15s ease-out',
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
    animation: 'cmFadeIn 0.15s ease-out',
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

  // Hidden lines (for multi-line blocks like tables, math, mermaid)
  '.cm-hidden-line': {
    height: '0 !important',
    padding: '0 !important',
    minHeight: '0 !important',
  },

  // Collapsed heading content (animated)
  '.cm-collapsed-line': {
    height: '0 !important',
    minHeight: '0 !important',
    padding: '0 !important',
    margin: '0 !important',
    overflow: 'hidden !important',
    opacity: '0',
    lineHeight: '0 !important',
    transition: 'height 0.15s ease-out, opacity 0.1s ease-out, padding 0.15s ease-out',
  },

  // Heading preview with collapse toggle
  '.cm-heading-preview': {
    display: 'inline-flex',
    alignItems: 'center',
    animation: 'cmFadeIn 0.12s ease-out',
  },

  // Collapse toggle button
  '.cm-collapse-toggle': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: '0.8em',
    opacity: '0',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
    marginLeft: '-20px',
    width: '20px',
    height: '1em',
    flexShrink: '0',
  },
  // Collapsed: always visible
  '.cm-collapse-toggle.collapsed': {
    transform: 'rotate(0deg)',
    opacity: '0.4',
  },
  '.cm-collapse-toggle.collapsed:hover': {
    opacity: '1',
  },
  // Expanded: only visible on hover
  '.cm-collapse-toggle.expanded': {
    transform: 'rotate(90deg)',
  },
  '.cm-line:hover .cm-collapse-toggle.expanded': {
    opacity: '0.4',
  },
  '.cm-line:hover .cm-collapse-toggle.expanded:hover': {
    opacity: '1',
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

  // Inline image preview
  '.cm-image-preview': {
    display: 'block',
    padding: '8px 0',
    cursor: 'pointer',
    animation: 'cmFadeIn 0.15s ease-out',
  },
  '.cm-image-preview img': {
    maxWidth: '100%',
    maxHeight: '400px',
    objectFit: 'contain',
    borderRadius: '6px',
    display: 'block',
  },
  '.cm-image-alt': {
    display: 'block',
    fontSize: '0.8em',
    marginTop: '4px',
    fontStyle: 'italic',
  },
  '.cm-image-error': {
    display: 'block',
    padding: '12px',
    fontSize: '0.85em',
    borderRadius: '6px',
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
  },

  // Frontmatter property editor
  '.cm-frontmatter-preview': {
    display: 'block',
    margin: '0',
    padding: '8px 12px',
    borderRadius: '6px',
    animation: 'cmFadeIn 0.15s ease-out',
  },
  '.cm-frontmatter-table': {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9em',
  },
  '.cm-frontmatter-table td': {
    padding: '3px 8px',
    verticalAlign: 'middle',
  },
  '.cm-frontmatter-key': {
    fontWeight: '600',
    whiteSpace: 'nowrap',
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: '0.9em',
    width: '1%',
    paddingRight: '16px',
    userSelect: 'none',
  },
  '.cm-frontmatter-value-cell': {
    width: '100%',
  },
  '.cm-frontmatter-value': {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    alignItems: 'center',
  },
  '.cm-frontmatter-input': {
    border: 'none',
    background: 'transparent',
    width: '100%',
    font: 'inherit',
    fontSize: '1em',
    outline: 'none',
    padding: '2px 4px',
    borderRadius: '3px',
  },
  '.cm-frontmatter-input:focus': {
    outline: 'none',
  },
  '.cm-frontmatter-checkbox': {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    margin: '0',
  },
  '.cm-frontmatter-tag': {
    display: 'inline-block',
    padding: '1px 8px',
    borderRadius: '10px',
    fontSize: '0.9em',
    cursor: 'text',
    outline: 'none',
    lineHeight: '1.5',
  },
  '.cm-frontmatter-add-tag': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '0.85em',
    opacity: '0.4',
    userSelect: 'none',
  },
  '.cm-frontmatter-add-tag:hover': {
    opacity: '1',
  },
  '.cm-frontmatter-action-cell': {
    width: '1%',
    whiteSpace: 'nowrap',
  },
  '.cm-frontmatter-delete': {
    cursor: 'pointer',
    opacity: '0',
    fontSize: '1.1em',
    padding: '0 4px',
    userSelect: 'none',
    transition: 'opacity 0.1s ease',
  },
  '.cm-frontmatter-table tr:hover .cm-frontmatter-delete': {
    opacity: '0.3',
  },
  '.cm-frontmatter-table tr:hover .cm-frontmatter-delete:hover': {
    opacity: '1',
  },
  '.cm-frontmatter-add': {
    cursor: 'pointer',
    opacity: '0.4',
    fontSize: '0.85em',
    padding: '4px 8px',
    userSelect: 'none',
  },
  '.cm-frontmatter-add:hover': {
    opacity: '0.8',
  },
  '.cm-frontmatter-error': {
    fontStyle: 'italic',
    fontSize: '0.9em',
    padding: '4px 0',
    cursor: 'pointer',
  },
  '.cm-frontmatter-line': {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: '0.9em',
    animation: 'cmFadeIn 0.1s ease-out',
  },

  // Word count panel
  '.cm-word-count-panel': {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    padding: '4px 16px',
    fontSize: '12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    userSelect: 'none',
  },
  '.cm-word-count-stat': {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0 10px',
  },
  '.cm-word-count-value': {
    fontWeight: '600',
    fontVariantNumeric: 'tabular-nums',
  },
  '.cm-word-count-label': {
    fontWeight: '400',
  },
  '.cm-word-count-divider': {
    width: '1px',
    height: '12px',
    flexShrink: '0',
  },

  // Tag pills
  '.md-tag': {
    display: 'inline-block',
    padding: '1px 8px',
    borderRadius: '10px',
    fontSize: '0.9em',
    cursor: 'pointer',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: '1.5',
    verticalAlign: 'baseline',
  },
  '.cm-tag-mark': {
    borderRadius: '3px',
  },

  // Smooth transitions: focused lines fade in when raw markdown appears
  '.cm-selectedLine': {
    animation: 'cmFadeIn 0.1s ease-out',
  },
  '.cm-table-line': {
    animation: 'cmFadeIn 0.1s ease-out',
  },
  '.cm-math-block-line': {
    animation: 'cmFadeIn 0.1s ease-out',
  },
  '.cm-mermaid-block-line': {
    animation: 'cmFadeIn 0.1s ease-out',
  },
  // Focus mode: unfocused lines
  '.cm-unfocused-line': {
    opacity: '0.25',
    transition: 'opacity 0.2s ease',
  },
});
