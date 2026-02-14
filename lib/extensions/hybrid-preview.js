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
import yaml from 'js-yaml';
import { allowReadOnlyEdit } from './read-only.js';
import {
  renderMarkdownLine,
  renderTable,
  renderBlockMath,
  renderFootnoteBlock,
  renderDefinitionList,
  CUSTOM_TASK_TYPES,
  findWikiLinks,
} from '../utils/markdown.js';

/**
 * Facet to configure whether collapse functionality is enabled
 */
const enableCollapseFacet = Facet.define({
  combine(values) {
    return values.length > 0 ? values[values.length - 1] : true;
  },
});

const DEFAULT_CUSTOM_TASK_TYPES = CUSTOM_TASK_TYPES;
const TASK_TOKEN_REGEX = /^(\s*(?:[-*+]|\d+\.)\s+)\[([ xX!?>i*<])\]/;

function normalizeCustomTaskTypes(types) {
  if (!Array.isArray(types)) {
    return [...DEFAULT_CUSTOM_TASK_TYPES];
  }

  const normalized = [];
  const seen = new Set();
  for (const raw of types) {
    if (typeof raw !== 'string' || raw.length === 0) continue;
    const token = raw.toLowerCase();
    if (!DEFAULT_CUSTOM_TASK_TYPES.includes(token)) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    normalized.push(token);
  }

  return normalized;
}

function getTaskCycle(customTaskTypes) {
  return [' ', 'x', ...customTaskTypes];
}

function buildCustomTasksConfig(enableCustomTasks, customTaskTypes) {
  const normalizedTypes = normalizeCustomTaskTypes(customTaskTypes);
  return {
    enableCustomTasks: enableCustomTasks === true,
    customTaskTypes: normalizedTypes,
    customTaskTypeSet: new Set(normalizedTypes),
    taskCycle: getTaskCycle(normalizedTypes),
  };
}

const customTasksFacet = Facet.define({
  combine(values) {
    if (values.length === 0) {
      return buildCustomTasksConfig(false, DEFAULT_CUSTOM_TASK_TYPES);
    }
    return values[values.length - 1];
  },
});

function buildWikiLinksConfig(enableWikiLinks, renderWikiLinks, onWikiLinkClick) {
  const enabled = enableWikiLinks === true;
  const render = enabled && renderWikiLinks !== false;
  const handler = typeof onWikiLinkClick === 'function' ? onWikiLinkClick : null;
  return {
    enableWikiLinks: enabled,
    renderWikiLinks: render,
    onWikiLinkClick: handler,
  };
}

const wikiLinksFacet = Facet.define({
  combine(values) {
    if (values.length === 0) {
      return buildWikiLinksConfig(false, false, null);
    }
    return values[values.length - 1];
  },
});

function getListTaskToken(content, config) {
  const match = content.match(TASK_TOKEN_REGEX);
  if (!match) return null;

  const token = match[2].toLowerCase();
  if (token === ' ' || token === 'x') {
    return token;
  }

  if (!config.enableCustomTasks) return null;

  return config.customTaskTypeSet.has(token) ? token : null;
}

function getNextTaskToken(currentToken, cycle) {
  if (!Array.isArray(cycle) || cycle.length === 0) return currentToken;
  const index = cycle.indexOf(currentToken);
  if (index === -1) return cycle[0];
  return cycle[(index + 1) % cycle.length];
}

function replaceTaskToken(content, nextToken) {
  return content.replace(TASK_TOKEN_REGEX, `$1[${nextToken}]`);
}

function getWikiLinkData(element) {
  return {
    raw: element.getAttribute('data-wikilink') || '',
    title: element.getAttribute('data-wikilink-title') || '',
    section: element.getAttribute('data-wikilink-section') || '',
    alias: element.getAttribute('data-wikilink-alias') || '',
    display: element.textContent || '',
  };
}

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
    const customTasksConfig = view.state.facet(customTasksFacet);
    const wikiLinksConfig = view.state.facet(wikiLinksFacet);
    wrapper.innerHTML = renderMarkdownLine(this.content, {
      ...customTasksConfig,
      enableWikiLinks: wikiLinksConfig.renderWikiLinks,
    });

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

      // Check if clicked on a footnote back reference
      const footnoteBackref = e.target.closest('[data-footnote-ref]');
      if (footnoteBackref) {
        e.preventDefault();
        e.stopPropagation();
        const footnoteId = footnoteBackref.getAttribute('data-footnote-ref');
        const doc = view.state.doc;
        for (let i = 1; i <= doc.lines; i++) {
          const line = doc.line(i);
          if (line.text.match(new RegExp(`\\[\\^${footnoteId}\\](?!:)`))) {
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

      // Check if clicked on a wiki link (only if handler provided)
      const wikiLink = e.target.closest('[data-wikilink]');
      if (wikiLink && wikiLinksConfig.onWikiLinkClick) {
        e.preventDefault();
        e.stopPropagation();
        wikiLinksConfig.onWikiLinkClick(getWikiLinkData(wikiLink));
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

      // Check if clicked on a task toggle (checkbox or custom task icon)
      const taskToggle = e.target.closest('input[type="checkbox"], .md-task-icon');
      if (taskToggle) {
        e.preventDefault();
        e.stopPropagation();

        const taskConfig = view.state.facet(customTasksFacet);
        const currentToken = getListTaskToken(content, taskConfig);
        if (!currentToken) {
          return;
        }

        const nextToken = taskConfig.enableCustomTasks
          ? getNextTaskToken(currentToken, taskConfig.taskCycle)
          : (currentToken === 'x' ? ' ' : 'x');

        const newContent = replaceTaskToken(content, nextToken);
        if (newContent !== content) {
          view.dispatch({
            changes: { from: lineFrom, to: lineTo, insert: newContent },
            annotations: allowReadOnlyEdit.of(true),
          });
        }
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
    const customTasksConfig = view.state.facet(customTasksFacet);
    const wikiLinksConfig = view.state.facet(wikiLinksFacet);
    headingContent.innerHTML = renderMarkdownLine(this.content, {
      ...customTasksConfig,
      enableWikiLinks: wikiLinksConfig.renderWikiLinks,
    });
    wrapper.appendChild(headingContent);

    // Store references for click handler
    const lineFrom = this.lineFrom;
    const lineTo = this.lineTo;
    const content = this.content;

    // Handle click to position cursor (on the heading text, not toggle)
    headingContent.addEventListener('mousedown', (e) => {
      // Check if clicked on a wiki link (only if handler provided)
      const wikiLink = e.target.closest('[data-wikilink]');
      if (wikiLink && wikiLinksConfig.onWikiLinkClick) {
        e.preventDefault();
        e.stopPropagation();
        wikiLinksConfig.onWikiLinkClick(getWikiLinkData(wikiLink));
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
 * Detect YAML frontmatter at the start of the document.
 * Frontmatter must start on line 1 with `---` and end with a closing `---`.
 * @returns {{ start: number, end: number } | null}
 */
function computeFrontmatterRange(doc) {
  if (doc.lines < 2) return null;
  const firstLine = doc.line(1).text.trim();
  if (firstLine !== '---') return null;

  for (let i = 2; i <= doc.lines; i++) {
    const text = doc.line(i).text.trim();
    if (text === '---' || text === '...') {
      return { start: 1, end: i };
    }
  }

  return null;
}

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

function isIndentedContinuation(text) {
  return /^(\s{2,}|\t)/.test(text);
}

/**
 * Detect footnote definition blocks in the document (multi-line)
 */
function computeFootnoteDefinitionRanges(doc, codeBlockLineSet) {
  const ranges = [];

  for (let i = 1; i <= doc.lines; i++) {
    if (codeBlockLineSet.has(i)) continue;

    const line = doc.line(i);
    const match = line.text.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (!match) continue;

    const id = match[1];
    let end = i;

    for (let j = i + 1; j <= doc.lines; j++) {
      if (codeBlockLineSet.has(j)) break;
      const nextLine = doc.line(j).text;
      if (!isIndentedContinuation(nextLine)) {
        break;
      }
      end = j;
    }

    ranges.push({ start: i, end, id });
    i = end;
  }

  return ranges;
}

/**
 * Detect definition list blocks in the document
 */
function computeDefinitionListRanges(doc, codeBlockLineSet, footnoteLineSet) {
  const ranges = [];

  const isDefinitionLine = (text) => /^\s*:\s*/.test(text);
  const isTermCandidate = (text) => {
    if (!text.trim()) return false;
    if (/^\s/.test(text)) return false;
    if (/^[-*+]\s+/.test(text)) return false;
    if (/^\d+\.\s+/.test(text)) return false;
    if (/^>/.test(text)) return false;
    if (/^#{1,6}\s+/.test(text)) return false;
    const trimmed = text.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) return false;
    if (/^\[\^([^\]]+)\]:/.test(text)) return false;
    return true;
  };

  for (let i = 1; i <= doc.lines; i++) {
    if (codeBlockLineSet.has(i) || footnoteLineSet.has(i)) continue;

    const line = doc.line(i).text;
    if (!isTermCandidate(line)) continue;

    const nextLineNum = i + 1;
    if (nextLineNum > doc.lines) continue;
    if (codeBlockLineSet.has(nextLineNum) || footnoteLineSet.has(nextLineNum)) continue;

    const nextLine = doc.line(nextLineNum).text;
    if (!isDefinitionLine(nextLine)) continue;

    let end = nextLineNum;
    for (let j = nextLineNum + 1; j <= doc.lines; j++) {
      if (codeBlockLineSet.has(j) || footnoteLineSet.has(j)) break;
      const text = doc.line(j).text;
      if (isDefinitionLine(text) || isIndentedContinuation(text)) {
        end = j;
        continue;
      }
      break;
    }

    ranges.push({ start: i, end });
    i = end;
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
  const frontmatter = computeFrontmatterRange(doc);
  const frontmatterLines = frontmatter ? buildLineSet([frontmatter]) : new Set();

  const codeBlocks = computeCodeBlockRanges(doc);
  const codeBlockLines = buildLineSet(codeBlocks);

  const mathBlocks = computeMathBlockRanges(doc, codeBlockLines);
  const mathBlockLines = buildLineSet(mathBlocks);

  const tables = computeTableRanges(doc, codeBlockLines);
  const tableLines = buildLineSet(tables);

  const footnoteBlocks = computeFootnoteDefinitionRanges(doc, codeBlockLines);
  const footnoteBlockLines = buildLineSet(footnoteBlocks);

  const definitionLists = computeDefinitionListRanges(doc, codeBlockLines, footnoteBlockLines);
  const definitionListLines = buildLineSet(definitionLists);

  const mermaidBlocks = codeBlocks.filter(r => r.language === 'mermaid');
  const mermaidBlockLines = buildLineSet(mermaidBlocks);

  // Compute heading ranges for collapse functionality
  const headings = computeHeadingRanges(doc, codeBlockLines);
  const headingMap = buildHeadingMap(headings);

  return {
    frontmatter,
    frontmatterLines,
    codeBlocks,
    codeBlockLines,
    mathBlocks,
    mathBlockLines,
    tables,
    tableLines,
    footnoteBlocks,
    footnoteBlockLines,
    definitionLists,
    definitionListLines,
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
    const wikiLinksConfig = view.state.facet(wikiLinksFacet);
    wrapper.innerHTML = renderTable(this.rows, { enableWikiLinks: wikiLinksConfig.renderWikiLinks });

    const tableFrom = this.tableFrom;

    wrapper.addEventListener('mousedown', (e) => {
      const wikiLink = e.target.closest('[data-wikilink]');
      if (wikiLink && wikiLinksConfig.onWikiLinkClick) {
        e.preventDefault();
        e.stopPropagation();
        wikiLinksConfig.onWikiLinkClick(getWikiLinkData(wikiLink));
        return;
      }

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
 * Widget that renders a footnote definition block
 */
class FootnoteBlockWidget extends WidgetType {
  constructor(id, lines, from, to) {
    super();
    this.id = id;
    this.lines = lines;
    this.from = from;
    this.to = to;
  }

  toDOM(view) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-footnote-preview';
    const wikiLinksConfig = view.state.facet(wikiLinksFacet);
    wrapper.innerHTML = renderFootnoteBlock(this.id, this.lines, { enableWikiLinks: wikiLinksConfig.renderWikiLinks });

    const from = this.from;

    wrapper.addEventListener('mousedown', (e) => {
      const wikiLink = e.target.closest('[data-wikilink]');
      if (wikiLink && wikiLinksConfig.onWikiLinkClick) {
        e.preventDefault();
        e.stopPropagation();
        wikiLinksConfig.onWikiLinkClick(getWikiLinkData(wikiLink));
        return;
      }

      const footnoteBackref = e.target.closest('[data-footnote-ref]');
      if (footnoteBackref) {
        e.preventDefault();
        e.stopPropagation();
        const footnoteId = footnoteBackref.getAttribute('data-footnote-ref');
        const doc = view.state.doc;
        for (let i = 1; i <= doc.lines; i++) {
          const line = doc.line(i);
          if (line.text.match(new RegExp(`\\[\\^${footnoteId}\\](?!:)`))) {
            view.dispatch({
              selection: { anchor: line.from },
              scrollIntoView: true,
            });
            view.focus();
            return;
          }
        }
      }

      e.preventDefault();
      e.stopPropagation();

      view.dispatch({
        selection: { anchor: from },
        scrollIntoView: true,
      });
      view.focus();
    });

    return wrapper;
  }

  eq(other) {
    if (other.id !== this.id) return false;
    if (other.lines.length !== this.lines.length) return false;
    for (let i = 0; i < this.lines.length; i++) {
      if (other.lines[i] !== this.lines[i]) return false;
    }
    return true;
  }

  ignoreEvent(event) {
    return event.type !== 'mousedown';
  }
}

/**
 * Widget that renders a definition list block
 */
class DefinitionListWidget extends WidgetType {
  constructor(lines, from, to) {
    super();
    this.lines = lines;
    this.from = from;
    this.to = to;
  }

  toDOM(view) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-definition-list-preview';
    const wikiLinksConfig = view.state.facet(wikiLinksFacet);
    wrapper.innerHTML = renderDefinitionList(this.lines, { enableWikiLinks: wikiLinksConfig.renderWikiLinks });

    const from = this.from;

    wrapper.addEventListener('mousedown', (e) => {
      const wikiLink = e.target.closest('[data-wikilink]');
      if (wikiLink && wikiLinksConfig.onWikiLinkClick) {
        e.preventDefault();
        e.stopPropagation();
        wikiLinksConfig.onWikiLinkClick(getWikiLinkData(wikiLink));
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      view.dispatch({
        selection: { anchor: from },
        scrollIntoView: true,
      });
      view.focus();
    });

    return wrapper;
  }

  eq(other) {
    if (other.lines.length !== this.lines.length) return false;
    for (let i = 0; i < this.lines.length; i++) {
      if (other.lines[i] !== this.lines[i]) return false;
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
  const {
    frontmatterLines,
    codeBlockLines,
    tableLines,
    mathBlockLines,
    footnoteBlockLines,
    definitionListLines,
    headings,
  } = blockRanges;
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

      // Skip frontmatter lines (handled by frontmatterDecorations plugin)
      if (frontmatterLines.has(i)) {
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

      // Skip footnote definition lines (handled by footnoteBlockDecorations plugin)
      if (footnoteBlockLines.has(i)) {
        continue;
      }

      // Skip definition list lines (handled by definitionListDecorations plugin)
      if (definitionListLines.has(i)) {
        continue;
      }

      const line = state.doc.line(i);
      const content = line.text;

      // Skip standalone image lines (handled by imageDecorations plugin)
      if (parseImageLine(content)) {
        continue;
      }

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
 * Build decorations for wiki links in focused lines
 */
function buildWikiLinkDecorations(view, blockRanges) {
  const wikiLinksConfig = view.state.facet(wikiLinksFacet);
  if (!wikiLinksConfig.enableWikiLinks) {
    return Decoration.none;
  }

  if (!view.hasFocus) {
    return Decoration.none;
  }

  const { state } = view;
  const focusedLines = getFocusedLines(state);
  const { codeBlockLines } = blockRanges;
  const decorations = [];

  for (const { from, to } of view.visibleRanges) {
    const startLine = state.doc.lineAt(from).number;
    const endLine = state.doc.lineAt(to).number;

    for (let i = startLine; i <= endLine; i++) {
      if (!focusedLines.has(i)) continue;
      if (codeBlockLines.has(i)) continue;

      const line = state.doc.line(i);
      if (!line.text.includes('[[')) continue;

      const matches = findWikiLinks(line.text);
      for (const match of matches) {
        decorations.push(
          Decoration.mark({ class: 'cm-wikilink' }).range(
            line.from + match.from,
            line.from + match.to
          )
        );
      }
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

const wikiLinkDecorations = ViewPlugin.fromClass(
  class {
    constructor(view) {
      const blockRanges = view.state.field(blockRangesField);
      this.decorations = buildWikiLinkDecorations(view, blockRanges);
    }

    update(update) {
      if (update.docChanged || update.selectionSet || update.viewportChanged || update.focusChanged) {
        const blockRanges = update.state.field(blockRangesField);
        this.decorations = buildWikiLinkDecorations(update.view, blockRanges);
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
 * Build decorations for footnote definition blocks
 * @param {EditorView} view - The editor view
 * @param {Object} blockRanges - Precomputed block ranges from StateField
 */
function buildFootnoteBlockDecorations(view, blockRanges) {
  const { state } = view;
  const hasFocus = view.hasFocus;
  const decorations = [];
  const { footnoteBlocks } = blockRanges;
  const focusedLines = hasFocus ? getFocusedLines(state) : new Set();

  for (const range of footnoteBlocks) {
    let blockFocused = false;
    for (let j = range.start; j <= range.end; j++) {
      if (focusedLines.has(j)) {
        blockFocused = true;
        break;
      }
    }

    if (blockFocused) {
      for (let i = range.start; i <= range.end; i++) {
        const line = state.doc.line(i);
        decorations.push(
          Decoration.line({ class: 'cm-footnote-line' }).range(line.from)
        );
      }
    } else {
      const lines = [];
      for (let j = range.start; j <= range.end; j++) {
        lines.push(state.doc.line(j).text);
      }
      const firstLine = state.doc.line(range.start);

      decorations.push(
        Decoration.replace({
          widget: new FootnoteBlockWidget(range.id, lines, firstLine.from, firstLine.to),
        }).range(firstLine.from, firstLine.to)
      );

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

const footnoteBlockDecorations = ViewPlugin.fromClass(
  class {
    constructor(view) {
      const blockRanges = view.state.field(blockRangesField);
      this.decorations = buildFootnoteBlockDecorations(view, blockRanges);
    }

    update(update) {
      if (update.docChanged || update.selectionSet || update.focusChanged) {
        const blockRanges = update.state.field(blockRangesField);
        this.decorations = buildFootnoteBlockDecorations(update.view, blockRanges);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * Build decorations for definition list blocks
 * @param {EditorView} view - The editor view
 * @param {Object} blockRanges - Precomputed block ranges from StateField
 */
function buildDefinitionListDecorations(view, blockRanges) {
  const { state } = view;
  const hasFocus = view.hasFocus;
  const decorations = [];
  const { definitionLists } = blockRanges;
  const focusedLines = hasFocus ? getFocusedLines(state) : new Set();

  for (const range of definitionLists) {
    let blockFocused = false;
    for (let j = range.start; j <= range.end; j++) {
      if (focusedLines.has(j)) {
        blockFocused = true;
        break;
      }
    }

    if (blockFocused) {
      for (let i = range.start; i <= range.end; i++) {
        const line = state.doc.line(i);
        decorations.push(
          Decoration.line({ class: 'cm-definition-list-line' }).range(line.from)
        );
      }
    } else {
      const lines = [];
      for (let j = range.start; j <= range.end; j++) {
        lines.push(state.doc.line(j).text);
      }
      const firstLine = state.doc.line(range.start);

      decorations.push(
        Decoration.replace({
          widget: new DefinitionListWidget(lines, firstLine.from, firstLine.to),
        }).range(firstLine.from, firstLine.to)
      );

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

const definitionListDecorations = ViewPlugin.fromClass(
  class {
    constructor(view) {
      const blockRanges = view.state.field(blockRangesField);
      this.decorations = buildDefinitionListDecorations(view, blockRanges);
    }

    update(update) {
      if (update.docChanged || update.selectionSet || update.focusChanged) {
        const blockRanges = update.state.field(blockRangesField);
        this.decorations = buildDefinitionListDecorations(update.view, blockRanges);
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

// ============================================================================
// INLINE IMAGE PREVIEW
// ============================================================================

const IMAGE_LINE_REGEX = /^!\[([^\]]*)\]\(([^)]+)\)$/;

/**
 * Check if a line contains only an image markdown syntax
 * @returns {{ alt: string, url: string } | null}
 */
function parseImageLine(text) {
  const match = text.trim().match(IMAGE_LINE_REGEX);
  if (!match) return null;
  return { alt: match[1], url: match[2].trim() };
}

/**
 * Widget that renders an image preview
 */
class ImagePreviewWidget extends WidgetType {
  constructor(alt, url, lineFrom, lineTo) {
    super();
    this.alt = alt;
    this.url = url;
    this.lineFrom = lineFrom;
    this.lineTo = lineTo;
  }

  toDOM(view) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-image-preview';

    const img = document.createElement('img');
    img.src = this.url;
    img.alt = this.alt;
    img.loading = 'lazy';

    img.addEventListener('error', () => {
      wrapper.textContent = '';
      const error = document.createElement('div');
      error.className = 'cm-image-error';
      error.textContent = `Image not found: ${this.url}`;
      wrapper.appendChild(error);
    });

    wrapper.appendChild(img);

    if (this.alt) {
      const altText = document.createElement('span');
      altText.className = 'cm-image-alt';
      altText.textContent = this.alt;
      wrapper.appendChild(altText);
    }

    const lineFrom = this.lineFrom;
    wrapper.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.dispatch({
        selection: { anchor: lineFrom },
        scrollIntoView: true,
      });
      view.focus();
    });

    return wrapper;
  }

  eq(other) {
    return other.url === this.url && other.alt === this.alt;
  }

  ignoreEvent(event) {
    return event.type !== 'mousedown';
  }
}

/**
 * Build decorations for standalone image lines
 */
function buildImageDecorations(view, blockRanges) {
  const { state } = view;
  const hasFocus = view.hasFocus;
  const decorations = [];
  const focusedLines = hasFocus ? getFocusedLines(state) : new Set();
  const {
    frontmatterLines,
    codeBlockLines,
    tableLines,
    mathBlockLines,
    footnoteBlockLines,
    definitionListLines,
    mermaidBlockLines,
  } = blockRanges;

  for (const { from, to } of view.visibleRanges) {
    const startLine = state.doc.lineAt(from).number;
    const endLine = state.doc.lineAt(to).number;

    for (let i = startLine; i <= endLine; i++) {
      if (focusedLines.has(i)) continue;
      if (frontmatterLines.has(i)) continue;
      if (codeBlockLines.has(i)) continue;
      if (tableLines.has(i)) continue;
      if (mathBlockLines.has(i)) continue;
      if (footnoteBlockLines.has(i)) continue;
      if (definitionListLines.has(i)) continue;
      if (mermaidBlockLines.has(i)) continue;

      const line = state.doc.line(i);
      const imageData = parseImageLine(line.text);
      if (!imageData) continue;

      decorations.push(
        Decoration.replace({
          widget: new ImagePreviewWidget(imageData.alt, imageData.url, line.from, line.to),
          block: true,
        }).range(line.from, line.to)
      );
    }
  }

  return Decoration.set(decorations, true);
}

const imageDecorations = ViewPlugin.fromClass(
  class {
    constructor(view) {
      const blockRanges = view.state.field(blockRangesField);
      this.decorations = buildImageDecorations(view, blockRanges);
    }

    update(update) {
      if (update.docChanged || update.selectionSet || update.viewportChanged || update.focusChanged) {
        const blockRanges = update.state.field(blockRangesField);
        this.decorations = buildImageDecorations(update.view, blockRanges);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// ============================================================================
// YAML FRONTMATTER PROPERTIES EDITOR
// ============================================================================

/**
 * Serialize a parsed YAML object back to frontmatter YAML string.
 * Produces clean output without trailing newline.
 */
function serializeYaml(obj) {
  if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) {
    return '';
  }
  // js-yaml.dump always adds a trailing newline, trim it since the document
  // structure already has newlines between content and the closing ---
  return yaml.dump(obj, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  }).trimEnd();
}

/**
 * Create a DOM element for displaying/editing a YAML value based on its type
 */
function createValueEditor(key, value, parsedYaml, fmContentFrom, fmContentTo, view) {
  const container = document.createElement('span');
  container.className = 'cm-frontmatter-value';

  if (typeof value === 'boolean') {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = value;
    checkbox.className = 'cm-frontmatter-checkbox';
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      const updated = { ...parsedYaml, [key]: checkbox.checked };
      const newYaml = serializeYaml(updated);
      view.dispatch({
        changes: { from: fmContentFrom, to: fmContentTo, insert: newYaml },
        annotations: allowReadOnlyEdit.of(true),
      });
    });
    container.appendChild(checkbox);
    return container;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const tag = document.createElement('span');
      tag.className = 'cm-frontmatter-tag';
      tag.textContent = String(value[i]);
      tag.contentEditable = 'true';
      tag.spellcheck = false;

      const idx = i;
      tag.addEventListener('blur', (e) => {
        e.stopPropagation();
        const newArr = [...value];
        const newVal = tag.textContent.trim();
        if (newVal === '') {
          newArr.splice(idx, 1);
        } else {
          newArr[idx] = newVal;
        }
        const updated = { ...parsedYaml, [key]: newArr };
        const newYaml = serializeYaml(updated);
        view.dispatch({
          changes: { from: fmContentFrom, to: fmContentTo, insert: newYaml },
          annotations: allowReadOnlyEdit.of(true),
        });
      });
      tag.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          tag.blur();
        }
        e.stopPropagation();
      });
      tag.addEventListener('mousedown', (e) => e.stopPropagation());
      container.appendChild(tag);
    }

    // Add tag button
    const addTag = document.createElement('span');
    addTag.className = 'cm-frontmatter-add-tag';
    addTag.textContent = '+';
    addTag.title = 'Add item';
    addTag.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    addTag.addEventListener('click', (e) => {
      e.stopPropagation();
      const newArr = [...value, 'new'];
      const updated = { ...parsedYaml, [key]: newArr };
      const newYaml = serializeYaml(updated);
      view.dispatch({
        changes: { from: fmContentFrom, to: fmContentTo, insert: newYaml },
        annotations: allowReadOnlyEdit.of(true),
      });
    });
    container.appendChild(addTag);
    return container;
  }

  if (value !== null && typeof value === 'object') {
    // Nested object: render as JSON-like text, editable
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cm-frontmatter-input';
    input.value = JSON.stringify(value);
    input.addEventListener('blur', (e) => {
      e.stopPropagation();
      try {
        const parsed = JSON.parse(input.value);
        const updated = { ...parsedYaml, [key]: parsed };
        const newYaml = serializeYaml(updated);
        view.dispatch({
          changes: { from: fmContentFrom, to: fmContentTo, insert: newYaml },
          annotations: allowReadOnlyEdit.of(true),
        });
      } catch {
        // Invalid JSON, revert
        input.value = JSON.stringify(value);
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      }
      e.stopPropagation();
    });
    input.addEventListener('mousedown', (e) => e.stopPropagation());
    container.appendChild(input);
    return container;
  }

  // String, number, date, null — text input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'cm-frontmatter-input';
  input.value = value === null ? '' : String(value);
  input.placeholder = value === null ? 'empty' : '';
  input.addEventListener('blur', (e) => {
    e.stopPropagation();
    const raw = input.value;
    // Try to preserve types: numbers, booleans, null
    let newValue;
    if (raw === '' || raw === 'null') {
      newValue = null;
    } else if (raw === 'true') {
      newValue = true;
    } else if (raw === 'false') {
      newValue = false;
    } else if (!isNaN(raw) && raw.trim() !== '') {
      newValue = Number(raw);
    } else {
      newValue = raw;
    }
    const updated = { ...parsedYaml, [key]: newValue };
    const newYaml = serializeYaml(updated);
    view.dispatch({
      changes: { from: fmContentFrom, to: fmContentTo, insert: newYaml },
      annotations: allowReadOnlyEdit.of(true),
    });
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    }
    e.stopPropagation();
  });
  input.addEventListener('mousedown', (e) => e.stopPropagation());
  container.appendChild(input);
  return container;
}

/**
 * Widget that renders YAML frontmatter as a property editor table
 */
class FrontmatterWidget extends WidgetType {
  constructor(yamlContent, blockFrom, blockTo, contentFrom, contentTo) {
    super();
    this.yamlContent = yamlContent;
    this.blockFrom = blockFrom;
    this.blockTo = blockTo;
    this.contentFrom = contentFrom;
    this.contentTo = contentTo;
  }

  toDOM(view) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-frontmatter-preview';

    let parsedYaml;
    try {
      parsedYaml = yaml.load(this.yamlContent);
    } catch {
      // Malformed YAML — show error message, click to edit
      const error = document.createElement('div');
      error.className = 'cm-frontmatter-error';
      error.textContent = 'Invalid YAML frontmatter — click to edit';
      wrapper.appendChild(error);

      wrapper.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        view.dispatch({
          selection: { anchor: this.blockFrom },
          scrollIntoView: true,
        });
        view.focus();
      });
      return wrapper;
    }

    if (!parsedYaml || typeof parsedYaml !== 'object') {
      parsedYaml = {};
    }

    const contentFrom = this.contentFrom;
    const contentTo = this.contentTo;
    const blockFrom = this.blockFrom;

    const table = document.createElement('table');
    table.className = 'cm-frontmatter-table';

    const keys = Object.keys(parsedYaml);

    for (const key of keys) {
      const row = document.createElement('tr');

      // Key cell
      const keyCell = document.createElement('td');
      keyCell.className = 'cm-frontmatter-key';
      keyCell.textContent = key;
      row.appendChild(keyCell);

      // Value cell
      const valueCell = document.createElement('td');
      valueCell.className = 'cm-frontmatter-value-cell';
      valueCell.appendChild(
        createValueEditor(key, parsedYaml[key], parsedYaml, contentFrom, contentTo, view)
      );
      row.appendChild(valueCell);

      // Delete button cell
      const deleteCell = document.createElement('td');
      deleteCell.className = 'cm-frontmatter-action-cell';
      const deleteBtn = document.createElement('span');
      deleteBtn.className = 'cm-frontmatter-delete';
      deleteBtn.textContent = '\u00d7';
      deleteBtn.title = 'Remove property';
      deleteBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const updated = { ...parsedYaml };
        delete updated[key];
        const newYaml = serializeYaml(updated);
        view.dispatch({
          changes: { from: contentFrom, to: contentTo, insert: newYaml },
          annotations: allowReadOnlyEdit.of(true),
        });
      });
      deleteCell.appendChild(deleteBtn);
      row.appendChild(deleteCell);

      table.appendChild(row);
    }

    wrapper.appendChild(table);

    // Add property button
    const addRow = document.createElement('div');
    addRow.className = 'cm-frontmatter-add';
    addRow.textContent = '+ Add property';
    addRow.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    addRow.addEventListener('click', (e) => {
      e.stopPropagation();
      // Generate a unique key name
      let newKey = 'property';
      let counter = 1;
      while (parsedYaml[newKey] !== undefined) {
        newKey = `property${counter}`;
        counter++;
      }
      const updated = { ...parsedYaml, [newKey]: '' };
      const newYaml = serializeYaml(updated);
      view.dispatch({
        changes: { from: contentFrom, to: contentTo, insert: newYaml },
        annotations: allowReadOnlyEdit.of(true),
      });
    });
    wrapper.appendChild(addRow);

    // Click on wrapper background focuses raw YAML
    wrapper.addEventListener('mousedown', (e) => {
      if (e.target === wrapper) {
        e.preventDefault();
        e.stopPropagation();
        view.dispatch({
          selection: { anchor: blockFrom },
          scrollIntoView: true,
        });
        view.focus();
      }
    });

    return wrapper;
  }

  eq(other) {
    return other.yamlContent === this.yamlContent;
  }

  ignoreEvent(event) {
    return event.type !== 'mousedown';
  }
}

/**
 * Build decorations for YAML frontmatter
 */
function buildFrontmatterDecorations(view, blockRanges) {
  const { state } = view;
  const hasFocus = view.hasFocus;
  const { frontmatter } = blockRanges;

  if (!frontmatter) {
    return Decoration.none;
  }

  const decorations = [];
  const focusedLines = hasFocus ? getFocusedLines(state) : new Set();

  // Check if any line in the frontmatter is focused
  let blockFocused = false;
  for (let j = frontmatter.start; j <= frontmatter.end; j++) {
    if (focusedLines.has(j)) {
      blockFocused = true;
      break;
    }
  }

  if (blockFocused) {
    // Show raw frontmatter lines with background styling
    for (let i = frontmatter.start; i <= frontmatter.end; i++) {
      const line = state.doc.line(i);
      decorations.push(
        Decoration.line({ class: 'cm-frontmatter-line' }).range(line.from)
      );
    }
  } else {
    // Collect YAML content (between the --- fences)
    const yamlLines = [];
    for (let j = frontmatter.start + 1; j < frontmatter.end; j++) {
      yamlLines.push(state.doc.line(j).text);
    }
    const yamlContent = yamlLines.join('\n');
    const firstLine = state.doc.line(frontmatter.start);
    const lastLine = state.doc.line(frontmatter.end);

    // Content range (between fences, for editing)
    // For non-empty frontmatter: spans from first content line to last content line
    // For empty frontmatter (---\n---): empty range at start of closing fence
    const hasContent = frontmatter.end - frontmatter.start > 1;
    const contentFrom = hasContent
      ? state.doc.line(frontmatter.start + 1).from
      : firstLine.to + 1; // right after opening ---\n
    const contentTo = hasContent
      ? state.doc.line(frontmatter.end - 1).to
      : firstLine.to + 1; // same = empty range

    // Replace first line with widget
    decorations.push(
      Decoration.replace({
        widget: new FrontmatterWidget(
          yamlContent,
          firstLine.from,
          lastLine.to,
          contentFrom,
          contentTo
        ),
      }).range(firstLine.from, firstLine.to)
    );

    // Hide remaining lines
    for (let i = frontmatter.start + 1; i <= frontmatter.end; i++) {
      const line = state.doc.line(i);
      decorations.push(
        Decoration.line({ class: 'cm-hidden-line' }).range(line.from),
        Decoration.replace({}).range(line.from, line.to)
      );
    }
  }

  return Decoration.set(decorations, true);
}

const frontmatterDecorations = ViewPlugin.fromClass(
  class {
    constructor(view) {
      const blockRanges = view.state.field(blockRangesField);
      this.decorations = buildFrontmatterDecorations(view, blockRanges);
    }

    update(update) {
      if (update.docChanged || update.selectionSet || update.focusChanged) {
        const blockRanges = update.state.field(blockRangesField);
        this.decorations = buildFrontmatterDecorations(update.view, blockRanges);
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
  const {
    enableCollapse = true,
    enableCustomTasks = false,
    customTaskTypes,
    enableWikiLinks = false,
    renderWikiLinks = true,
    onWikiLinkClick,
  } = options;

  const customTasksConfig = buildCustomTasksConfig(enableCustomTasks, customTaskTypes);
  const wikiLinksConfig = buildWikiLinksConfig(enableWikiLinks, renderWikiLinks, onWikiLinkClick);

  return [
    // Configuration facet for collapse functionality
    enableCollapseFacet.of(enableCollapse),
    // Configuration facet for custom task types
    customTasksFacet.of(customTasksConfig),
    // Configuration facet for wiki links
    wikiLinksFacet.of(wikiLinksConfig),
    // State for tracking collapsed headings (always included, but only used if collapse enabled)
    collapsedHeadingsField,
    // Shared state for block ranges (computed once per doc change)
    blockRangesField,
    // ViewPlugins that read from the shared state
    frontmatterDecorations,
    imageDecorations,
    hybridPreviewPlugin,
    wikiLinkDecorations,
    codeBlockDecorations,
    tableDecorations,
    footnoteBlockDecorations,
    definitionListDecorations,
    mathBlockDecorations,
    mermaidBlockDecorations,
  ];
}
