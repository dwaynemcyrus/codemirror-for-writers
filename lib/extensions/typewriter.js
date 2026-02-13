import { ViewPlugin } from '@codemirror/view';

/**
 * Typewriter mode plugin - keeps the cursor line vertically centered
 * in the viewport while typing or navigating.
 *
 * Uses requestMeasure to avoid layout thrashing and infinite update loops.
 */
export const typewriterPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.view = view;
    }

    update(update) {
      if (!update.selectionSet && !update.docChanged && !update.geometryChanged) {
        return;
      }

      this.view.requestMeasure({
        key: 'typewriter-scroll',
        read: (view) => {
          const head = view.state.selection.main.head;
          const coords = view.coordsAtPos(head);
          if (!coords) return null;

          const rect = view.scrollDOM.getBoundingClientRect();
          const viewportCenter = rect.top + rect.height / 2;
          const diff = coords.top - viewportCenter;

          if (Math.abs(diff) < 2) return null;
          return diff;
        },
        write: (diff, view) => {
          if (diff == null) return;
          view.scrollDOM.scrollBy({ top: diff, behavior: 'auto' });
        },
      });
    }
  }
);
