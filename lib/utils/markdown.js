import { marked } from 'marked';
import katex from 'katex';
import { gemoji } from 'gemoji';

const emojiMap = new Map();
for (const entry of gemoji) {
  if (!entry?.names?.length || !entry.emoji) continue;
  for (const name of entry.names) {
    if (!emojiMap.has(name)) {
      emojiMap.set(name, entry.emoji);
    }
  }
  if (entry.name && !emojiMap.has(entry.name)) {
    emojiMap.set(entry.name, entry.emoji);
  }
}

export const CUSTOM_TASK_TYPES = ['i', '!', '?', '*', '>', '<'];

const CUSTOM_TASK_META = {
  i: { emoji: '🧠', label: 'Idea', className: 'idea' },
  '!': { emoji: '⚠️', label: 'Urgent', className: 'urgent' },
  '?': { emoji: '❓', label: 'Question', className: 'question' },
  '*': { emoji: '⭐', label: 'Important', className: 'important' },
  '>': { emoji: '➡️', label: 'Forwarded', className: 'forwarded' },
  '<': { emoji: '📅', label: 'Scheduled', className: 'scheduled' },
};

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: false,
  pedantic: false,
  smartLists: true,
  smartypants: false, // Disable smart quotes to avoid character changes
});

/**
 * Process inline math $...$ and emoji :shortcode: before marked parsing
 */
function processInlineExtensions(text) {
  // Process inline math: $...$  (but not $$)
  text = text.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, (match, math) => {
    try {
      return katex.renderToString(math, { displayMode: false, throwOnError: false });
    } catch (e) {
      return match;
    }
  });

  // Process highlights: ==text==
  text = text.replace(/(?<!\=)==([^=\n]+?)==(?!=)/g, (match, inner) => {
    return `<mark class="md-highlight">${inner}</mark>`;
  });

  // Process subscripts: ~text~ (but not ~~)
  text = text.replace(/(?<!~)~(?!~)([^~\n]+?)~(?!~)/g, (match, inner) => {
    return `<sub class="md-subscript">${inner}</sub>`;
  });

  // Process superscripts: ^text^ (avoid footnote refs like [^id])
  text = text.replace(/(?<!\[)\^([^^\n]+?)\^(?!\^)/g, (match, inner) => {
    return `<sup class="md-superscript">${inner}</sup>`;
  });

  // Process emoji shortcodes: :name:
  text = text.replace(/:([a-zA-Z0-9_+-]+):/g, (match, name) => {
    return emojiMap.get(name) || match;
  });

  // Process footnote references: [^id] (but not definitions [^id]:)
  text = text.replace(/\[\^([^\]]+)\](?!:)/g, (match, id) => {
    return `<sup class="footnote-ref"><span class="footnote-link" data-footnote="${id}">[${id}]</span></sup>`;
  });

  return text;
}

/**
 * Render block math $$...$$
 */
export function renderBlockMath(content) {
  try {
    return katex.renderToString(content, { displayMode: true, throwOnError: false });
  } catch (e) {
    return `<span class="math-error">${content}</span>`;
  }
}

/**
 * Render a footnote reference [^id]
 */
export function renderFootnoteRef(id) {
  return `<sup class="footnote-ref"><a href="#fn-${id}" id="fnref-${id}">[${id}]</a></sup>`;
}

/**
 * Render a footnote definition [^id]: content
 */
export function renderFootnoteDef(id, content) {
  const rendered = processInlineExtensions(content);
  return `<span class="footnote-def"><sup>[${id}]</sup> ${marked.parseInline(rendered)}</span>`;
}

/**
 * Render a multi-line footnote definition block
 */
export function renderFootnoteBlock(id, lines) {
  if (!lines.length) return '';
  const firstMatch = lines[0].match(/^\[\^([^\]]+)\]:\s*(.*)$/);
  const firstContent = firstMatch ? firstMatch[2] : lines[0];
  const parts = [];

  const firstRendered = renderInline(firstContent);
  parts.push(`<div class="md-footnote-line md-footnote-first"><sup>[${id}]</sup> ${firstRendered}</div>`);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/^\s{2,}|\t/, '');
    const rendered = line.trim() ? renderInline(line) : '';
    parts.push(`<div class="md-footnote-line md-footnote-continuation">${rendered}</div>`);
  }

  return `<div class="md-footnote-block" data-footnote="${id}">${parts.join('')}</div>`;
}

/**
 * Render a definition list block (single term with one or more definitions)
 */
export function renderDefinitionList(lines) {
  if (lines.length === 0) return '';
  const term = lines[0].trim();
  const definitions = [];
  let current = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const defMatch = line.match(/^\s*:\s*(.*)$/);
    if (defMatch) {
      if (current) {
        definitions.push(current);
      }
      current = [defMatch[1]];
      continue;
    }

    if (current) {
      const continuation = line.replace(/^\s{2,}|\t/, '');
      current.push(continuation);
    }
  }

  if (current) {
    definitions.push(current);
  }

  const termHtml = renderInline(term);
  const defHtml = definitions.map((defLines) => {
    const rendered = defLines.map((line) => renderInline(line)).join('<br>');
    return `<dd>${rendered}</dd>`;
  }).join('');

  return `<dl class="md-definition-list"><dt>${termHtml}</dt>${defHtml}</dl>`;
}

/**
 * Render inline content with extensions (math, emoji) then marked
 */
function renderInline(text) {
  const processed = processInlineExtensions(text);
  return marked.parseInline(processed);
}

/**
 * Render a single line of markdown to HTML
 * Handles both block elements (headers) and inline elements
 */
export function renderMarkdownLine(content, options = {}) {
  if (!content.trim()) {
    return content;
  }

  const enableCustomTasks = options.enableCustomTasks === true;
  const customTaskTypes = Array.isArray(options.customTaskTypes)
    ? options.customTaskTypes
    : CUSTOM_TASK_TYPES;
  const customTaskSet = options.customTaskTypeSet ?? new Set(customTaskTypes);

  // Check if it's a footnote definition [^id]: content
  const footnoteDefMatch = content.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
  if (footnoteDefMatch) {
    return renderFootnoteDef(footnoteDefMatch[1], footnoteDefMatch[2]);
  }

  // Check if it's a header line
  const headerMatch = content.match(/^(#{1,6})\s+(.*)$/);
  if (headerMatch) {
    const level = headerMatch[1].length;
    let text = headerMatch[2];
    let headingId = null;
    const idMatch = text.match(/^(.*)\s+\[#([A-Za-z0-9_-]+)\]\s*$/);
    if (idMatch) {
      text = idMatch[1];
      headingId = idMatch[2];
    }
    const idAttr = headingId ? ` id="${headingId}" data-heading-id="${headingId}"` : '';
    return `<span class="md-header md-h${level}"${idAttr}>${renderInline(text)}</span>`;
  }

  // Check if it's a blockquote
  if (content.startsWith('>')) {
    const text = content.replace(/^>\s*/, '');
    return `<span class="md-blockquote">${renderInline(text)}</span>`;
  }

  // Check if it's a list item
  const listMatch = content.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
  if (listMatch) {
    const marker = listMatch[2];
    const text = listMatch[3];
    // Check for task list
    const taskMatch = text.match(/^\[([ xX])\]\s*(.*)$/);
    if (taskMatch) {
      const checked = taskMatch[1].toLowerCase() === 'x';
      const emoji = checked ? '✅' : '⬜️';
      const label = checked ? 'Completed' : 'Incomplete';
      const stateClass = checked ? 'complete' : 'incomplete';
      const token = checked ? 'x' : ' ';
      return `<span class="md-list-item md-task-item"><span class="md-list-marker">${marker}</span> <span class="md-task-icon md-task-${stateClass}" data-task="${token}" role="button" aria-label="${label}" title="${label}">${emoji}</span> ${renderInline(taskMatch[2])}</span>`;
    }

    if (enableCustomTasks) {
      const customTaskMatch = text.match(/^\[([!?>i*<])\]\s*(.*)$/);
      if (customTaskMatch) {
        const token = customTaskMatch[1];
        const meta = CUSTOM_TASK_META[token];
        if (meta && customTaskSet.has(token)) {
          return `<span class="md-list-item md-task-item"><span class="md-list-marker">${marker}</span> <span class="md-task-icon md-task-${meta.className}" data-task="${token}" role="button" aria-label="${meta.label}" title="${meta.label}">${meta.emoji}</span> ${renderInline(customTaskMatch[2])}</span>`;
        }
      }
    }
    return `<span class="md-list-item"><span class="md-list-marker">${marker}</span> ${renderInline(text)}</span>`;
  }

  // Check if it's a horizontal rule
  if (/^(-{3,}|_{3,}|\*{3,})$/.test(content.trim())) {
    return '<hr class="md-hr">';
  }

  // Check if it's a table row
  if (content.trim().startsWith('|') && content.trim().endsWith('|')) {
    const trimmed = content.trim();
    // Check if it's a separator row (|---|---|) - only contains |, -, :, and spaces
    if (/^\|[-:\s|]+\|$/.test(trimmed) && trimmed.includes('-')) {
      return `<span class="md-table-separator"></span>`;
    }
    // Parse cells
    const cells = trimmed.slice(1, -1).split('|').map(cell => cell.trim());
    const renderedCells = cells.map(cell => {
      return `<span class="md-table-cell">${renderInline(cell)}</span>`;
    }).join('');
    return `<span class="md-table-row">${renderedCells}</span>`;
  }

  // Default: render as inline markdown with extensions
  return renderInline(content);
}

/**
 * Render a full markdown document
 */
export function renderDocument(content) {
  return marked.parse(content);
}

/**
 * Render a table from an array of row strings
 */
export function renderTable(rows) {
  if (rows.length === 0) return '';

  const parseRow = (row) => {
    const trimmed = row.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
    return trimmed.slice(1, -1).split('|').map(cell => cell.trim());
  };

  const isSeparator = (row) => {
    const trimmed = row.trim();
    return /^\|[-:\s|]+\|$/.test(trimmed) && trimmed.includes('-');
  };

  // Find header and body rows
  let headerRow = null;
  let bodyRows = [];
  let separatorFound = false;

  for (const row of rows) {
    if (isSeparator(row)) {
      separatorFound = true;
      continue;
    }

    const cells = parseRow(row);
    if (!cells) continue;

    if (!separatorFound && !headerRow) {
      headerRow = cells;
    } else {
      bodyRows.push(cells);
    }
  }

  // Build HTML table
  let html = '<table class="md-table">';

  if (headerRow) {
    html += '<thead><tr>';
    for (const cell of headerRow) {
      html += `<th>${renderInline(cell)}</th>`;
    }
    html += '</tr></thead>';
  }

  if (bodyRows.length > 0) {
    html += '<tbody>';
    for (const row of bodyRows) {
      html += '<tr>';
      for (const cell of row) {
        html += `<td>${renderInline(cell)}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
  }

  html += '</table>';
  return html;
}
