/**
 * Hybrid Preview Extension for CodeMirror 6
 *
 * This extension provides "hybrid" markdown editing where:
 * - Lines WITHOUT cursor/selection show rendered preview (headings, bold, etc.)
 * - Lines WITH cursor/selection show raw markdown for editing
 *
 * ============================================================================
 * FOCUS/DECORATION INTERACTION
 * ============================================================================
 *
 * The key concept is "focused lines" - lines that contain any part of the
 * cursor or selection. These lines show raw markdown; all others show preview.
 *
 * Focus determination:
 * 1. Get all selection ranges from state.selection.ranges
 * 2. For each range, find start/end line numbers
 * 3. All lines in between are "focused" (added to Set)
 *
 * Decoration rules:
 * - Focused lines: No decoration (show raw markdown)
 * - Unfocused lines: Replace with MarkdownPreviewWidget (rendered HTML)
 * - Code blocks: Entire block focused if ANY line has cursor
 * - Tables: Entire table focused if ANY line has cursor
 * - Math blocks: Entire block focused if ANY line has cursor
 * - Mermaid diagrams: Entire block focused if ANY line has cursor
 *
 * When editor loses focus (hasFocus=false):
 * - ALL lines render as preview (no editing happening)
 *
 * Click handling:
 * - Clicking on preview calculates approximate character position
 * - Dispatches selection change to position cursor
 * - This triggers rebuild, showing raw markdown for that line
 *
 * ============================================================================
 */

import { EditorView, Decoration, WidgetType, ViewPlugin } from '@codemirror/view';
import { StateField, StateEffect, Facet } from '@codemirror/state';
import { renderMarkdownLine, renderTable, renderBlockMath } from '../utils/markdown.js';

/**
 * Facet to configure whether collapse functionality is enabled
 */
const enableCollapseFacet = Facet.define({
  combine(values) {
    return values.length > 0 ? values[values.length - 1] : true;
  },
});

// ============================================================================
// HEADING COLLAPSE STATE
// ============================================================================

/**
 * StateEffect to toggle collapse state of a heading
 */
export const toggleCollapseEffect = StateEffect.define();

/**
 * StateField that tracks which headings are collapsed.
 * Stores a Set of line numbers (1-based) that are collapsed.
 */
export const collapsedHeadingsField = StateField.define({
  create() {
    return new Set();
  },
  update(collapsed, tr) {
    let newCollapsed = collapsed;

    // Handle toggle effects
    for (const effect of tr.effects) {
      if (effect.is(toggleCollapseEffect)) {
        newCollapsed = new Set(collapsed);
        if (newCollapsed.has(effect.value)) {
          newCollapsed.delete(effect.value);
        } else {
          newCollapsed.add(effect.value);
        }
      }
    }

    // Handle document changes - need to adjust line numbers
    if (tr.docChanged && newCollapsed.size > 0) {
      const adjustedSet = new Set();
      for (const lineNum of newCollapsed) {
        // Try to find the new line number after the change
        // Map the old position to new position
        const oldDoc = tr.startState.doc;
        if (lineNum <= oldDoc.lines) {
          const oldLine = oldDoc.line(lineNum);
          const newPos = tr.changes.mapPos(oldLine.from);
          const newLineNum = tr.newDoc.lineAt(newPos).number;
          // Verify it's still a heading
          const newLineText = tr.newDoc.line(newLineNum).text;
          if (/^#{1,6}\s/.test(newLineText)) {
            adjustedSet.add(newLineNum);
          }
        }
      }
      newCollapsed = adjustedSet;
    }

    return newCollapsed;
  },
});
import { highlightCode } from '../utils/syntax-highlight.js';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  themeVariables: {
    primaryColor: '#f5f5f5',
    secondaryColor: '#f5f5f5',
    tertiaryColor: '#f5f5f5',
    primaryBorderColor: '#ddd',
    secondaryBorderColor: '#ddd',
    tertiaryBorderColor: '#ddd',
    lineColor: '#aaa',
    edgeLabelBackground: '#fff',
  },
});

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
 * Widget that renders a heading with a collapse toggle button
 */
class HeadingPreviewWidget extends WidgetType {
  constructor(content, lineFrom, lineTo, lineNumber, level, isCollapsed, hasContent) {
    super();
    this.content = content;
    this.lineFrom = lineFrom;
    this.lineTo = lineTo;
    this.lineNumber = lineNumber;
    this.level = level;
    this.isCollapsed = isCollapsed;
    this.hasContent = hasContent; // Whether this heading has content under it
  }

  toDOM(view) {
    const wrapper = document.createElement('span');
    wrapper.className = 'cm-markdown-preview cm-heading-preview';

    // Create collapse toggle button (only if heading has content)
    if (this.hasContent) {
      const toggle = document.createElement('span');
      toggle.className = `cm-collapse-toggle ${this.isCollapsed ? 'collapsed' : 'expanded'}`;
      toggle.textContent = '›';
      toggle.title = this.isCollapsed ? 'Expand' : 'Collapse';

      const lineNumber = this.lineNumber;

      // Use click instead of mousedown to avoid focus issues
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Dispatch the toggle effect without changing selection
        view.dispatch({
          effects: toggleCollapseEffect.of(lineNumber),
        });
      });

      // Also prevent mousedown from affecting focus
      toggle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      });

      wrapper.appendChild(toggle);
    }

    // Render the heading content
    const headingContent = document.createElement('span');
    headingContent.innerHTML = renderMarkdownLine(this.content);
    wrapper.appendChild(headingContent);

    // Store references for click handler
    const lineFrom = this.lineFrom;
    const lineTo = this.lineTo;
    const content = this.content;

    // Handle click to position cursor (on the heading text, not toggle)
    headingContent.addEventListener('mousedown', (e) => {
      // Check if clicked on a link
      const link = e.target.closest('a');
      if (link && link.href) {
        e.preventDefault();
        e.stopPropagation();
        window.open(link.href, '_blank', 'noopener,noreferrer');
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Get click position relative to the wrapper
      const rect = headingContent.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const totalWidth = rect.width;

      // Estimate character position based on click location
      const textLength = content.length;
      let charPos;

      if (totalWidth > 0 && textLength > 0) {
        const ratio = clickX / totalWidth;
        charPos = Math.round(ratio * textLength);
        charPos = Math.max(0, Math.min(charPos, textLength));
      } else {
        charPos = 0;
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
    return other.content === this.content &&
           other.lineFrom === this.lineFrom &&
           other.lineTo === this.lineTo &&
           other.isCollapsed === this.isCollapsed &&
           other.hasContent === this.hasContent;
  }

  ignoreEvent(event) {
    return event.type !== 'mousedown';
  }
}

/**
 * Get the set of line numbers that contain the cursor or selection
 */
function getFocusedLines(state) {
  const focused = new Set();

  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from).number;
    const endLine = state.doc.lineAt(range.to).number;

    for (let i = startLine; i <= endLine; i++) {
      focused.add(i);
    }
  }

  return focused;
}

// ============================================================================
// SHARED STATE FOR BLOCK RANGES (Performance Optimization)
// ============================================================================
//
// Block ranges (code blocks, tables, math, mermaid) are computed ONCE per
// document change and shared across all ViewPlugins via a StateField.
// This avoids redundant O(n) document scans on every keystroke.
//
// The StateField also provides O(1) Set-based lookups for line membership.
// ============================================================================

/**
 * Detect code blocks in the document and return line ranges with language
 */
function computeCodeBlockRanges(doc) {
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
 * Detect math blocks ($$...$$) in the document
 */
function computeMathBlockRanges(doc, codeBlockLineSet) {
  const ranges = [];
  let mathStart = null;

  for (let i = 1; i <= doc.lines; i++) {
    // Skip lines inside code blocks (O(1) lookup)
    if (codeBlockLineSet.has(i)) {
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
 * Detect table blocks in the document
 */
function computeTableRanges(doc, codeBlockLineSet) {
  const ranges = [];
  let tableStart = null;

  for (let i = 1; i <= doc.lines; i++) {
    // Skip lines inside code blocks (O(1) lookup)
    if (codeBlockLineSet.has(i)) {
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
 * Build a Set of line numbers from an array of ranges (for O(1) lookup)
 */
function buildLineSet(ranges) {
  const lineSet = new Set();
  for (const range of ranges) {
    for (let i = range.start; i <= range.end; i++) {
      lineSet.add(i);
    }
  }
  return lineSet;
}

/**
 * Compute heading ranges - for each heading, determine which lines belong to it
 * A heading's content extends until the next heading of equal or higher level
 * @returns {Array<{line: number, level: number, endLine: number}>}
 */
function computeHeadingRanges(doc, codeBlockLines) {
  const headings = [];

  // First pass: find all headings
  for (let i = 1; i <= doc.lines; i++) {
    if (codeBlockLines.has(i)) continue;

    const line = doc.line(i);
    const match = line.text.match(/^(#{1,6})\s+/);
    if (match) {
      headings.push({
        line: i,
        level: match[1].length,
        endLine: doc.lines, // Will be adjusted in second pass
      });
    }
  }

  // Second pass: determine end lines for each heading
  for (let i = 0; i < headings.length; i++) {
    const current = headings[i];
    // Find next heading of equal or higher level (lower number)
    for (let j = i + 1; j < headings.length; j++) {
      if (headings[j].level <= current.level) {
        current.endLine = headings[j].line - 1;
        break;
      }
    }
  }

  return headings;
}

/**
 * Build a map from line number to its parent heading (for collapse checking)
 * @returns {Map<number, number>} Map from line number to heading line number
 */
function buildHeadingMap(headings) {
  const map = new Map();
  for (const heading of headings) {
    // Map all lines in this heading's range to the heading line
    for (let i = heading.line + 1; i <= heading.endLine; i++) {
      // Only set if not already set (deeper headings take precedence)
      if (!map.has(i)) {
        map.set(i, heading.line);
      }
    }
  }
  return map;
}

/**
 * StateField that computes and caches all block ranges.
 * Recomputed only when the document changes.
 */
const blockRangesField = StateField.define({
  create(state) {
    return computeBlockRanges(state.doc);
  },
  update(value, tr) {
    // Only recompute if document changed
    if (tr.docChanged) {
      return computeBlockRanges(tr.newDoc);
    }
    return value;
  },
});

/**
 * Compute all block ranges and line sets for the document
 */
function computeBlockRanges(doc) {
  const codeBlocks = computeCodeBlockRanges(doc);
  const codeBlockLines = buildLineSet(codeBlocks);

  const mathBlocks = computeMathBlockRanges(doc, codeBlockLines);
  const mathBlockLines = buildLineSet(mathBlocks);

  const tables = computeTableRanges(doc, codeBlockLines);
  const tableLines = buildLineSet(tables);

  const mermaidBlocks = codeBlocks.filter(r => r.language === 'mermaid');
  const mermaidBlockLines = buildLineSet(mermaidBlocks);

  // Compute heading ranges for collapse functionality
  const headings = computeHeadingRanges(doc, codeBlockLines);
  const headingMap = buildHeadingMap(headings);

  return {
    codeBlocks,
    codeBlockLines,
    mathBlocks,
    mathBlockLines,
    tables,
    tableLines,
    mermaidBlocks,
    mermaidBlockLines,
    headings,
    headingMap,
  };
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
 * Widget that renders a mermaid diagram
 */
class MermaidBlockWidget extends WidgetType {
  constructor(content, mermaidFrom, mermaidTo) {
    super();
    this.content = content;
    this.mermaidFrom = mermaidFrom;
    this.mermaidTo = mermaidTo;
    this.id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
  }

  toDOM(view) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-mermaid-preview';

    const mermaidFrom = this.mermaidFrom;
    const content = this.content;
    const id = this.id;

    // Render mermaid diagram asynchronously
    (async () => {
      try {
        const { svg } = await mermaid.render(id, content);
        wrapper.innerHTML = svg;
      } catch (e) {
        wrapper.innerHTML = `<pre class="mermaid-error">${e.message}</pre>`;
      }
    })();

    wrapper.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      view.dispatch({
        selection: { anchor: mermaidFrom },
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
    // Fast array comparison without JSON.stringify
    if (other.rows.length !== this.rows.length) return false;
    for (let i = 0; i < this.rows.length; i++) {
      if (other.rows[i] !== this.rows[i]) return false;
    }
    return true;
  }

  ignoreEvent(event) {
    return event.type !== 'mousedown';
  }
}

/**
 * Check if a line should be hidden due to a collapsed heading
 * @param {number} lineNum - Line number to check
 * @param {Array} headings - Array of heading objects
 * @param {Set} collapsed - Set of collapsed heading line numbers
 * @returns {boolean} True if line should be hidden
 */
function isLineCollapsed(lineNum, headings, collapsed) {
  for (const heading of headings) {
    // Check if this heading is collapsed and contains the line
    if (collapsed.has(heading.line) && lineNum > heading.line && lineNum <= heading.endLine) {
      return true;
    }
  }
  return false;
}

/**
 * Get heading info for a line if it's a heading
 */
function getHeadingInfo(lineNum, headings) {
  for (const heading of headings) {
    if (heading.line === lineNum) {
      return heading;
    }
  }
  return null;
}

/**
 * Build decorations for all non-focused lines (viewport-aware)
 * @param {EditorView} view - The editor view
 * @param {Object} blockRanges - Precomputed block ranges from StateField
 */
function buildDecorations(view, blockRanges) {
  const { state } = view;
  const hasFocus = view.hasFocus;
  // If editor doesn't have focus, render preview for all lines
  const focusedLines = hasFocus ? getFocusedLines(state) : new Set();
  const { codeBlockLines, tableLines, mathBlockLines, headings } = blockRanges;
  const decorations = [];

  // Check if collapse functionality is enabled
  const collapseEnabled = state.facet(enableCollapseFacet);

  // Get collapsed headings state (only if collapse is enabled)
  const collapsed = collapseEnabled ? state.field(collapsedHeadingsField) : new Set();

  // Only process lines in the visible viewport (+ small buffer)
  for (const { from, to } of view.visibleRanges) {
    const startLine = state.doc.lineAt(from).number;
    const endLine = state.doc.lineAt(to).number;

    for (let i = startLine; i <= endLine; i++) {
      // Check if line is hidden due to collapsed heading (only if collapse enabled)
      if (collapseEnabled && isLineCollapsed(i, headings, collapsed)) {
        // Hide the line with a line decoration (CSS handles animation)
        const line = state.doc.line(i);
        decorations.push(
          Decoration.line({ class: 'cm-collapsed-line' }).range(line.from)
        );
        continue;
      }

      // Skip lines that contain the cursor/selection
      if (focusedLines.has(i)) {
        continue;
      }

      // Skip lines inside code blocks (show raw with styling) - O(1) lookup
      if (codeBlockLines.has(i)) {
        continue;
      }

      // Skip table lines (handled by separate tableDecorations plugin) - O(1) lookup
      if (tableLines.has(i)) {
        continue;
      }

      // Skip math block lines (handled by mathBlockDecorations plugin) - O(1) lookup
      if (mathBlockLines.has(i)) {
        continue;
      }

      const line = state.doc.line(i);
      const content = line.text;

      // Skip empty lines
      if (!content.trim()) {
        continue;
      }

      // Check if this is a heading line (use special widget only if collapse is enabled)
      if (collapseEnabled) {
        const headingInfo = getHeadingInfo(i, headings);
        if (headingInfo) {
          // Check if heading has content (endLine > line)
          const hasContent = headingInfo.endLine > headingInfo.line;
          const isCollapsed = collapsed.has(i);

          decorations.push(
            Decoration.replace({
              widget: new HeadingPreviewWidget(
                content,
                line.from,
                line.to,
                i,
                headingInfo.level,
                isCollapsed,
                hasContent
              ),
              inclusive: false,
              block: false,
            }).range(line.from, line.to)
          );
          continue;
        }
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
  }

  return Decoration.set(decorations, true);
}

/**
 * ViewPlugin to manage preview decorations
 */
const hybridPreviewPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      const blockRanges = view.state.field(blockRangesField);
      this.decorations = buildDecorations(view, blockRanges);
    }

    update(update) {
      // Check if any collapse effects were dispatched
      const hasCollapseEffect = update.transactions.some(tr =>
        tr.effects.some(e => e.is(toggleCollapseEffect))
      );

      // Rebuild on doc changes, selection changes, viewport changes, focus changes, or collapse changes
      if (update.docChanged || update.selectionSet || update.viewportChanged || update.focusChanged || hasCollapseEffect) {
        const blockRanges = update.state.field(blockRangesField);
        this.decorations = buildDecorations(update.view, blockRanges);
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
 * @param {EditorView} view - The editor view
 * @param {Object} blockRanges - Precomputed block ranges from StateField
 */
function buildCodeBlockDecorations(view, blockRanges) {
  const { state } = view;
  const hasFocus = view.hasFocus;
  const decorations = [];
  const { codeBlocks } = blockRanges;
  const focusedLines = hasFocus ? getFocusedLines(state) : new Set();

  for (const range of codeBlocks) {
    // Skip mermaid blocks - they're handled separately
    if (range.language === 'mermaid') {
      continue;
    }
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

const codeBlockDecorations = ViewPlugin.fromClass(
  class {
    constructor(view) {
      const blockRanges = view.state.field(blockRangesField);
      this.decorations = buildCodeBlockDecorations(view, blockRanges);
    }

    update(update) {
      if (update.docChanged || update.selectionSet || update.focusChanged) {
        const blockRanges = update.state.field(blockRangesField);
        this.decorations = buildCodeBlockDecorations(update.view, blockRanges);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * Build decorations for tables
 * @param {EditorView} view - The editor view
 * @param {Object} blockRanges - Precomputed block ranges from StateField
 */
function buildTableDecorations(view, blockRanges) {
  const { state } = view;
  const hasFocus = view.hasFocus;
  const decorations = [];
  const { tables } = blockRanges;
  const focusedLines = hasFocus ? getFocusedLines(state) : new Set();

  for (const range of tables) {
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
      // Render table as widget on first line, hide other lines
      const rows = [];
      for (let j = range.start; j <= range.end; j++) {
        rows.push(state.doc.line(j).text);
      }
      const firstLine = state.doc.line(range.start);

      // Replace first line with widget
      decorations.push(
        Decoration.replace({
          widget: new TableWidget(rows, firstLine.from, firstLine.to),
        }).range(firstLine.from, firstLine.to)
      );

      // Hide remaining table lines
      for (let i = range.start + 1; i <= range.end; i++) {
        const line = state.doc.line(i);
        decorations.push(
          Decoration.line({ class: 'cm-hidden-line' }).range(line.from),
          Decoration.replace({}).range(line.from, line.to)
        );
      }
    }
  }

  return Decoration.set(decorations, true);
}

const tableDecorations = ViewPlugin.fromClass(
  class {
    constructor(view) {
      const blockRanges = view.state.field(blockRangesField);
      this.decorations = buildTableDecorations(view, blockRanges);
    }

    update(update) {
      if (update.docChanged || update.selectionSet || update.focusChanged) {
        const blockRanges = update.state.field(blockRangesField);
        this.decorations = buildTableDecorations(update.view, blockRanges);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * Build decorations for math blocks
 * @param {EditorView} view - The editor view
 * @param {Object} blockRanges - Precomputed block ranges from StateField
 */
function buildMathBlockDecorations(view, blockRanges) {
  const { state } = view;
  const hasFocus = view.hasFocus;
  const decorations = [];
  const { mathBlocks } = blockRanges;
  const focusedLines = hasFocus ? getFocusedLines(state) : new Set();

  for (const range of mathBlocks) {
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

      // Replace first line with widget, hide other lines with empty replacements
      decorations.push(
        Decoration.replace({
          widget: new MathBlockWidget(mathContent, firstLine.from, firstLine.to),
        }).range(firstLine.from, firstLine.to)
      );

      // Hide remaining lines (content and closing $$)
      for (let i = range.start + 1; i <= range.end; i++) {
        const line = state.doc.line(i);
        decorations.push(
          Decoration.line({ class: 'cm-hidden-line' }).range(line.from),
          Decoration.replace({}).range(line.from, line.to)
        );
      }
    }
  }

  return Decoration.set(decorations, true);
}

const mathBlockDecorations = ViewPlugin.fromClass(
  class {
    constructor(view) {
      const blockRanges = view.state.field(blockRangesField);
      this.decorations = buildMathBlockDecorations(view, blockRanges);
    }

    update(update) {
      if (update.docChanged || update.selectionSet || update.focusChanged) {
        const blockRanges = update.state.field(blockRangesField);
        this.decorations = buildMathBlockDecorations(update.view, blockRanges);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * Build decorations for mermaid blocks
 * @param {EditorView} view - The editor view
 * @param {Object} blockRanges - Precomputed block ranges from StateField
 */
function buildMermaidBlockDecorations(view, blockRanges) {
  const { state } = view;
  const hasFocus = view.hasFocus;
  const decorations = [];
  const { mermaidBlocks } = blockRanges;
  const focusedLines = hasFocus ? getFocusedLines(state) : new Set();

  for (const range of mermaidBlocks) {
    // Check if any line in this mermaid block is focused
    let mermaidFocused = false;
    for (let j = range.start; j <= range.end; j++) {
      if (focusedLines.has(j)) {
        mermaidFocused = true;
        break;
      }
    }

    if (mermaidFocused) {
      // Show raw mermaid lines with background styling
      for (let i = range.start; i <= range.end; i++) {
        const line = state.doc.line(i);
        decorations.push(
          Decoration.line({ class: 'cm-mermaid-block-line' }).range(line.from)
        );
      }
    } else {
      // Collect mermaid content (excluding ``` fences)
      const mermaidLines = [];
      for (let j = range.start + 1; j < range.end; j++) {
        mermaidLines.push(state.doc.line(j).text);
      }
      const mermaidContent = mermaidLines.join('\n');
      const firstLine = state.doc.line(range.start);

      // Replace first line with widget
      decorations.push(
        Decoration.replace({
          widget: new MermaidBlockWidget(mermaidContent, firstLine.from, firstLine.to),
        }).range(firstLine.from, firstLine.to)
      );

      // Hide remaining lines
      for (let i = range.start + 1; i <= range.end; i++) {
        const line = state.doc.line(i);
        decorations.push(
          Decoration.line({ class: 'cm-hidden-line' }).range(line.from),
          Decoration.replace({}).range(line.from, line.to)
        );
      }
    }
  }

  return Decoration.set(decorations, true);
}

const mermaidBlockDecorations = ViewPlugin.fromClass(
  class {
    constructor(view) {
      const blockRanges = view.state.field(blockRangesField);
      this.decorations = buildMermaidBlockDecorations(view, blockRanges);
    }

    update(update) {
      if (update.docChanged || update.selectionSet || update.focusChanged) {
        const blockRanges = update.state.field(blockRangesField);
        this.decorations = buildMermaidBlockDecorations(update.view, blockRanges);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * The hybrid preview extension
 * @param {Object} options - Configuration options
 * @param {boolean} [options.enableCollapse=true] - Enable heading collapse functionality
 */
export function hybridPreview(options = {}) {
  const { enableCollapse = true } = options;

  return [
    // Configuration facet for collapse functionality
    enableCollapseFacet.of(enableCollapse),
    // State for tracking collapsed headings (always included, but only used if collapse enabled)
    collapsedHeadingsField,
    // Shared state for block ranges (computed once per doc change)
    blockRangesField,
    // ViewPlugins that read from the shared state
    hybridPreviewPlugin,
    codeBlockDecorations,
    tableDecorations,
    mathBlockDecorations,
    mermaidBlockDecorations,
  ];
}
