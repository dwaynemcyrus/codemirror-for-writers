import { EditorView, Decoration, WidgetType, ViewPlugin } from '@codemirror/view';
import { StateField } from '@codemirror/state';
import { renderMarkdownLine, renderTable, renderBlockMath } from '../../utils/markdown.js';
import { highlightCode } from '../../utils/syntax-highlight.js';

/**
 * Widget that renders a markdown line as HTML
 * Handles click events to position cursor correctly
 */
class MarkdownPreviewWidget extends WidgetType {
  constructor(content, lineFrom, lineTo) {
    super();
    this.content = content;
    this.lineFrom = lineFrom;
    this.lineTo = lineTo;
  }

  toDOM(view) {
    const wrapper = document.createElement('span');
    wrapper.className = 'cm-markdown-preview';
    wrapper.innerHTML = renderMarkdownLine(this.content);

    // Store references for click handler
    const lineFrom = this.lineFrom;
    const lineTo = this.lineTo;
    const content = this.content;

    // Handle click to position cursor
    wrapper.addEventListener('mousedown', (e) => {
      // Check if clicked on a footnote link
      const footnoteLink = e.target.closest('[data-footnote]');
      if (footnoteLink) {
        e.preventDefault();
        e.stopPropagation();
        const footnoteId = footnoteLink.getAttribute('data-footnote');
        // Find the footnote definition line [^id]:
        const doc = view.state.doc;
        for (let i = 1; i <= doc.lines; i++) {
          const line = doc.line(i);
          if (line.text.match(new RegExp(`^\\[\\^${footnoteId}\\]:`))) {
            view.dispatch({
              selection: { anchor: line.from },
              scrollIntoView: true,
            });
            view.focus();
            return;
          }
        }
        return;
      }

      // Check if clicked on a link
      const link = e.target.closest('a');
      if (link && link.href) {
        e.preventDefault();
        e.stopPropagation();
        window.open(link.href, '_blank', 'noopener,noreferrer');
        return;
      }

      // Check if clicked on a checkbox
      const checkbox = e.target.closest('input[type="checkbox"]');
      if (checkbox) {
        e.preventDefault();
        e.stopPropagation();

        // Toggle checkbox in the markdown content
        const isChecked = content.includes('[x]') || content.includes('[X]');
        const newContent = isChecked
          ? content.replace(/\[x\]/i, '[ ]')
          : content.replace(/\[ \]/, '[x]');

        view.dispatch({
          changes: { from: lineFrom, to: lineTo, insert: newContent },
        });
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Get click position relative to the wrapper
      const rect = wrapper.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const totalWidth = rect.width;

      // Estimate character position based on click location
      const textLength = content.length;
      let charPos;

      if (totalWidth > 0 && textLength > 0) {
        // Calculate position proportionally
        const ratio = clickX / totalWidth;
        charPos = Math.round(ratio * textLength);
        charPos = Math.max(0, Math.min(charPos, textLength));
      } else {
        charPos = 0;
      }

      const cursorPos = lineFrom + charPos;

      // Dispatch selection change
      view.dispatch({
        selection: { anchor: cursorPos },
        scrollIntoView: true,
      });

      view.focus();
    });

    return wrapper;
  }

  eq(other) {
    return other.content === this.content &&
           other.lineFrom === this.lineFrom &&
           other.lineTo === this.lineTo;
  }

  ignoreEvent(event) {
    // We handle mousedown ourselves
    return event.type !== 'mousedown';
  }
}

/**
 * Get the set of line numbers that contain the cursor or selection
 * Only returns focused lines when the editor is truly being edited (unless bypassFocusCheck is true)
 * @param {EditorState} state - The editor state
 * @param {EditorView|true} viewOrBypass - Either the view object for focus checking, or true to bypass focus check and always return focused lines based on selection
 */
function getFocusedLines(state, viewOrBypass) {
  const focused = new Set();

  // If viewOrBypass is true, bypass focus check (for code blocks, tables, math blocks)
  if (viewOrBypass === true) {
    // Always return focused lines based on selection only
    for (const range of state.selection.ranges) {
      const startLine = state.doc.lineAt(range.from).number;
      const endLine = state.doc.lineAt(range.to).number;
      for (let i = startLine; i <= endLine; i++) {
        focused.add(i);
      }
    }
    return focused;
  }

  // Otherwise, viewOrBypass should be a view object
  const view = viewOrBypass;
  
  // Check if editor is truly focused by verifying activeElement
  // This properly detects when keyboard is hidden on iOS
  const isActivelyEditing = view.hasFocus && 
    view.contentDOM && 
    document.activeElement &&
    (document.activeElement === view.contentDOM || 
     view.contentDOM.contains(document.activeElement));

  // If editor isn't actively being edited, no lines are considered focused
  // This allows preview to render when keyboard is hidden (e.g., on iOS)
  if (!isActivelyEditing) {
    return focused;
  }

  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from).number;
    const endLine = state.doc.lineAt(range.to).number;

    for (let i = startLine; i <= endLine; i++) {
      focused.add(i);
    }
  }

  return focused;
}

/**
 * Detect code blocks in the document and return line ranges with language
 */
function getCodeBlockRanges(doc) {
  const ranges = [];
  let inCodeBlock = false;
  let blockStart = 0;
  let blockLanguage = '';

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text;

    if (text.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        blockStart = i;
        blockLanguage = text.slice(3).trim();
      } else {
        ranges.push({ start: blockStart, end: i, language: blockLanguage });
        inCodeBlock = false;
        blockLanguage = '';
      }
    }
  }

  // Handle unclosed code block
  if (inCodeBlock) {
    ranges.push({ start: blockStart, end: doc.lines, language: blockLanguage });
  }

  return ranges;
}


/**
 * Check if a line is inside a code block
 */
function isInCodeBlock(lineNum, codeBlockRanges) {
  return codeBlockRanges.some(range => lineNum >= range.start && lineNum <= range.end);
}

/**
 * Detect math blocks ($$...$$) in the document
 */
function getMathBlockRanges(doc, codeBlockRanges) {
  const ranges = [];
  let mathStart = null;

  for (let i = 1; i <= doc.lines; i++) {
    // Skip lines inside code blocks
    if (isInCodeBlock(i, codeBlockRanges)) {
      if (mathStart !== null) {
        mathStart = null; // Reset if we enter a code block
      }
      continue;
    }

    const line = doc.line(i);
    const text = line.text.trim();

    if (text === '$$') {
      if (mathStart === null) {
        mathStart = i;
      } else {
        ranges.push({ start: mathStart, end: i });
        mathStart = null;
      }
    }
  }

  return ranges;
}

/**
 * Check if a line is inside a math block
 */
function isInMathBlock(lineNum, mathBlockRanges) {
  return mathBlockRanges.some(range => lineNum >= range.start && lineNum <= range.end);
}

/**
 * Widget that renders a math block
 */
class MathBlockWidget extends WidgetType {
  constructor(content, mathFrom, mathTo) {
    super();
    this.content = content;
    this.mathFrom = mathFrom;
    this.mathTo = mathTo;
  }

  toDOM(view) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-math-preview';
    wrapper.innerHTML = renderBlockMath(this.content);

    const mathFrom = this.mathFrom;

    wrapper.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      view.dispatch({
        selection: { anchor: mathFrom },
        scrollIntoView: true,
      });
      view.focus();
    });

    return wrapper;
  }

  eq(other) {
    return other.content === this.content;
  }

  ignoreEvent(event) {
    return event.type !== 'mousedown';
  }
}

/**
 * Detect table blocks in the document
 */
function getTableRanges(doc, codeBlockRanges) {
  const ranges = [];
  let tableStart = null;

  for (let i = 1; i <= doc.lines; i++) {
    // Skip lines inside code blocks
    if (isInCodeBlock(i, codeBlockRanges)) {
      if (tableStart !== null) {
        ranges.push({ start: tableStart, end: i - 1 });
        tableStart = null;
      }
      continue;
    }

    const line = doc.line(i);
    const text = line.text.trim();
    const isTableLine = text.startsWith('|') && text.endsWith('|');

    if (isTableLine) {
      if (tableStart === null) {
        tableStart = i;
      }
    } else {
      if (tableStart !== null) {
        ranges.push({ start: tableStart, end: i - 1 });
        tableStart = null;
      }
    }
  }

  // Handle table at end of document
  if (tableStart !== null) {
    ranges.push({ start: tableStart, end: doc.lines });
  }

  return ranges;
}

/**
 * Check if a line is inside a table
 */
function isInTable(lineNum, tableRanges) {
  return tableRanges.some(range => lineNum >= range.start && lineNum <= range.end);
}

/**
 * Widget that renders a complete table
 */
class TableWidget extends WidgetType {
  constructor(rows, tableFrom, tableTo) {
    super();
    this.rows = rows;
    this.tableFrom = tableFrom;
    this.tableTo = tableTo;
  }

  toDOM(view) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-table-preview';
    wrapper.innerHTML = renderTable(this.rows);

    const tableFrom = this.tableFrom;

    wrapper.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Position cursor at start of table
      view.dispatch({
        selection: { anchor: tableFrom },
        scrollIntoView: true,
      });
      view.focus();
    });

    return wrapper;
  }

  eq(other) {
    return JSON.stringify(other.rows) === JSON.stringify(this.rows);
  }

  ignoreEvent(event) {
    return event.type !== 'mousedown';
  }
}

/**
 * Build decorations for all non-focused lines
 */
function buildDecorations(state, view) {
  const focusedLines = getFocusedLines(state, view);
  const codeBlockRanges = getCodeBlockRanges(state.doc);
  const tableRanges = getTableRanges(state.doc, codeBlockRanges);
  const mathBlockRanges = getMathBlockRanges(state.doc, codeBlockRanges);
  const decorations = [];

  for (let i = 1; i <= state.doc.lines; i++) {
    // Skip lines that contain the cursor/selection
    if (focusedLines.has(i)) {
      continue;
    }

    // Skip lines inside code blocks (show raw with styling)
    if (isInCodeBlock(i, codeBlockRanges)) {
      continue;
    }

    // Skip table lines (handled by tableDecorations StateField)
    if (isInTable(i, tableRanges)) {
      continue;
    }

    // Skip math block lines (handled by mathBlockDecorations StateField)
    if (isInMathBlock(i, mathBlockRanges)) {
      continue;
    }

    const line = state.doc.line(i);
    const content = line.text;

    // Skip empty lines
    if (!content.trim()) {
      continue;
    }

    // Create replace decoration for the line content
    decorations.push(
      Decoration.replace({
        widget: new MarkdownPreviewWidget(content, line.from, line.to),
        inclusive: false,
        block: false,
      }).range(line.from, line.to)
    );
  }

  return Decoration.set(decorations, true);
}

/**
 * ViewPlugin to manage preview decorations
 */
const hybridPreviewPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = buildDecorations(view.state, view);
    }

    update(update) {
      // Always rebuild on doc changes, selection changes, focus changes, or viewport changes
      if (update.docChanged || update.selectionSet || update.focusChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.state, update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * Widget that renders a syntax-highlighted code line
 */
class HighlightedCodeWidget extends WidgetType {
  constructor(content, language, lineFrom, lineTo) {
    super();
    this.content = content;
    this.language = language;
    this.lineFrom = lineFrom;
    this.lineTo = lineTo;
  }

  toDOM(view) {
    const wrapper = document.createElement('span');
    wrapper.className = 'cm-highlighted-code';
    wrapper.innerHTML = highlightCode(this.content, this.language);

    const lineFrom = this.lineFrom;
    const lineTo = this.lineTo;
    const content = this.content;

    wrapper.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Estimate character position based on click location
      const rect = wrapper.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const totalWidth = rect.width;
      const textLength = content.length;

      let charPos = 0;
      if (totalWidth > 0 && textLength > 0) {
        const ratio = clickX / totalWidth;
        charPos = Math.round(ratio * textLength);
        charPos = Math.max(0, Math.min(charPos, textLength));
      }

      const cursorPos = lineFrom + charPos;

      view.dispatch({
        selection: { anchor: cursorPos },
        scrollIntoView: true,
      });
      view.focus();
    });

    return wrapper;
  }

  eq(other) {
    return other.content === this.content && other.language === this.language;
  }

  ignoreEvent(event) {
    return event.type !== 'mousedown';
  }
}

/**
 * Build line decorations for code blocks (adds background styling and syntax highlighting)
 */
function buildCodeBlockDecorations(state) {
  const decorations = [];
  const codeBlockRanges = getCodeBlockRanges(state.doc);
  const focusedLines = getFocusedLines(state, true); // Always consider as focused for code blocks

  for (const range of codeBlockRanges) {
    // Check if any line in this code block is focused
    let blockFocused = false;
    for (let j = range.start; j <= range.end; j++) {
      if (focusedLines.has(j)) {
        blockFocused = true;
        break;
      }
    }

    // Check if block has content lines (not just fences)
    const hasContent = range.end - range.start > 1;

    for (let i = range.start; i <= range.end; i++) {
      const line = state.doc.line(i);
      const isFence = i === range.start || i === range.end;

      // Hide fence lines when not focused and block has content
      if (isFence && !blockFocused && hasContent) {
        decorations.push(
          Decoration.replace({}).range(line.from, line.to)
        );
        continue;
      }

      // Add background styling - use focused style if block is being edited
      const lineClass = blockFocused ? 'cm-code-block-line cm-code-block-focused' : 'cm-code-block-line';
      decorations.push(
        Decoration.line({ class: lineClass }).range(line.from)
      );

      // Add syntax highlighting for content lines (not fences, not focused)
      const isFocused = focusedLines.has(i);

      if (!isFence && !isFocused && line.text.length > 0) {
        decorations.push(
          Decoration.replace({
            widget: new HighlightedCodeWidget(line.text, range.language, line.from, line.to),
          }).range(line.from, line.to)
        );
      }
    }
  }

  return Decoration.set(decorations, true);
}

const codeBlockDecorations = StateField.define({
  create(state) {
    return buildCodeBlockDecorations(state);
  },

  update(decorations, tr) {
    if (tr.docChanged || tr.selection) {
      return buildCodeBlockDecorations(tr.state);
    }
    return decorations;
  },

  provide(field) {
    return EditorView.decorations.from(field);
  },
});

/**
 * Build decorations for tables
 */
function buildTableDecorations(state) {
  const decorations = [];
  const codeBlockRanges = getCodeBlockRanges(state.doc);
  const tableRanges = getTableRanges(state.doc, codeBlockRanges);
  const focusedLines = getFocusedLines(state, true); // Always consider as focused for tables

  for (const range of tableRanges) {
    // Check if any line in this table is focused
    let tableFocused = false;
    for (let j = range.start; j <= range.end; j++) {
      if (focusedLines.has(j)) {
        tableFocused = true;
        break;
      }
    }

    if (tableFocused) {
      // Show raw table lines with background styling
      for (let i = range.start; i <= range.end; i++) {
        const line = state.doc.line(i);
        decorations.push(
          Decoration.line({ class: 'cm-table-line' }).range(line.from)
        );
      }
    } else {
      // Render table as a single widget
      const rows = [];
      for (let j = range.start; j <= range.end; j++) {
        rows.push(state.doc.line(j).text);
      }
      const firstLine = state.doc.line(range.start);
      const lastLine = state.doc.line(range.end);

      decorations.push(
        Decoration.replace({
          widget: new TableWidget(rows, firstLine.from, lastLine.to),
        }).range(firstLine.from, lastLine.to)
      );
    }
  }

  return Decoration.set(decorations, true);
}

const tableDecorations = StateField.define({
  create(state) {
    return buildTableDecorations(state);
  },

  update(decorations, tr) {
    if (tr.docChanged || tr.selection) {
      return buildTableDecorations(tr.state);
    }
    return decorations;
  },

  provide(field) {
    return EditorView.decorations.from(field);
  },
});

/**
 * Build decorations for math blocks
 */
function buildMathBlockDecorations(state) {
  const decorations = [];
  const codeBlockRanges = getCodeBlockRanges(state.doc);
  const mathBlockRanges = getMathBlockRanges(state.doc, codeBlockRanges);
  const focusedLines = getFocusedLines(state, true); // Always consider as focused for math blocks

  for (const range of mathBlockRanges) {
    // Check if any line in this math block is focused
    let mathFocused = false;
    for (let j = range.start; j <= range.end; j++) {
      if (focusedLines.has(j)) {
        mathFocused = true;
        break;
      }
    }

    if (mathFocused) {
      // Show raw math lines with background styling
      for (let i = range.start; i <= range.end; i++) {
        const line = state.doc.line(i);
        decorations.push(
          Decoration.line({ class: 'cm-math-block-line' }).range(line.from)
        );
      }
    } else {
      // Collect math content (excluding $$ delimiters)
      const mathLines = [];
      for (let j = range.start + 1; j < range.end; j++) {
        mathLines.push(state.doc.line(j).text);
      }
      const mathContent = mathLines.join('\n');
      const firstLine = state.doc.line(range.start);
      const lastLine = state.doc.line(range.end);

      decorations.push(
        Decoration.replace({
          widget: new MathBlockWidget(mathContent, firstLine.from, lastLine.to),
        }).range(firstLine.from, lastLine.to)
      );
    }
  }

  return Decoration.set(decorations, true);
}

const mathBlockDecorations = StateField.define({
  create(state) {
    return buildMathBlockDecorations(state);
  },

  update(decorations, tr) {
    if (tr.docChanged || tr.selection) {
      return buildMathBlockDecorations(tr.state);
    }
    return decorations;
  },

  provide(field) {
    return EditorView.decorations.from(field);
  },
});

/**
 * The hybrid preview extension
 */
export function hybridPreview() {
  return [hybridPreviewPlugin, codeBlockDecorations, tableDecorations, mathBlockDecorations];
}
