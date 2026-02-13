import { ViewPlugin, Decoration } from '@codemirror/view';
import { RangeSet } from '@codemirror/state';

const unfocusedLine = Decoration.line({ class: 'cm-unfocused-line' });

/**
 * Find the paragraph boundaries (blank-line delimited) around a position.
 * Returns { from: lineNumber, to: lineNumber } (1-based line numbers).
 */
function findParagraphRange(doc, pos) {
  const line = doc.lineAt(pos);
  let from = line.number;
  let to = line.number;

  // Walk up to find first blank line or start of doc
  while (from > 1) {
    const prev = doc.line(from - 1);
    if (prev.text.trim() === '') break;
    from--;
  }

  // Walk down to find next blank line or end of doc
  while (to < doc.lines) {
    const next = doc.line(to + 1);
    if (next.text.trim() === '') break;
    to++;
  }

  return { from, to };
}

/**
 * Focus mode plugin - dims all paragraphs except the one(s) containing cursors.
 * Applies `cm-unfocused-line` decoration to non-active lines.
 * Only active when the editor has focus.
 */
export const focusModePlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = this.buildDecorations(view);
    }

    update(update) {
      if (
        update.selectionSet ||
        update.docChanged ||
        update.focusChanged
      ) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view) {
      if (!view.hasFocus) {
        return RangeSet.empty;
      }

      const doc = view.state.doc;
      const activeLines = new Set();

      // For each selection range, find its paragraph and mark all lines as active
      for (const range of view.state.selection.ranges) {
        const para = findParagraphRange(doc, range.head);
        for (let i = para.from; i <= para.to; i++) {
          activeLines.add(i);
        }
      }

      const decorations = [];
      for (let i = 1; i <= doc.lines; i++) {
        if (!activeLines.has(i)) {
          const line = doc.line(i);
          decorations.push(unfocusedLine.range(line.from));
        }
      }

      return RangeSet.of(decorations);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
