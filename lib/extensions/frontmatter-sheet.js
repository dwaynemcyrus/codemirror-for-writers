/**
 * Frontmatter Sheet Overlay
 *
 * A slide-down overlay that displays the YAML frontmatter property table
 * on top of the editor content area. Managed by a ViewPlugin that appends
 * DOM to view.dom.
 */

import { ViewPlugin } from '@codemirror/view';
import { Facet } from '@codemirror/state';
import {
  toggleSheetEffect,
  frontmatterSheetField,
  blockRangesField,
  buildFrontmatterPropertyTable,
} from './hybrid-preview.js';
import { allowReadOnlyEdit } from './read-only.js';

/**
 * Facet for providing known frontmatter keys for autocomplete.
 * Consumers provide an array of strings.
 */
export const frontmatterKeysFacet = Facet.define({
  combine(values) {
    if (values.length === 0) return [];
    return values[values.length - 1];
  },
});

export const frontmatterSheetPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.view = view;
      this.backdrop = null;
      this.sheet = null;
      this.escHandler = null;
      this.isOpen = view.state.field(frontmatterSheetField);
      if (this.isOpen) this.open();
    }

    update(update) {
      const wasOpen = this.isOpen;
      this.isOpen = update.state.field(frontmatterSheetField);

      if (!wasOpen && this.isOpen) {
        this.open();
      } else if (wasOpen && !this.isOpen) {
        this.close();
      } else if (this.isOpen && update.docChanged) {
        this.rebuildContent();
      }
    }

    open() {
      const view = this.view;

      // Create backdrop
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'cm-frontmatter-sheet-backdrop';
      this.backdrop.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        view.dispatch({ effects: toggleSheetEffect.of(false) });
      });

      // Create sheet container
      this.sheet = document.createElement('div');
      this.sheet.className = 'cm-frontmatter-sheet';

      // Header
      const header = document.createElement('div');
      header.className = 'cm-frontmatter-sheet-header';
      const title = document.createElement('span');
      title.className = 'cm-frontmatter-sheet-title';
      title.textContent = 'Properties';
      header.appendChild(title);

      const closeBtn = document.createElement('button');
      closeBtn.className = 'cm-frontmatter-sheet-close';
      closeBtn.textContent = '\u00d7';
      closeBtn.title = 'Close';
      closeBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        view.dispatch({ effects: toggleSheetEffect.of(false) });
      });
      header.appendChild(closeBtn);

      this.sheet.appendChild(header);

      // Content area
      this.contentEl = document.createElement('div');
      this.contentEl.className = 'cm-frontmatter-sheet-content';
      this.sheet.appendChild(this.contentEl);

      this.buildContent();

      // Append to view.dom (the .cm-editor element)
      view.dom.appendChild(this.backdrop);
      view.dom.appendChild(this.sheet);

      // Lock scroll
      view.scrollDOM.style.overflow = 'hidden';

      // Escape key handler
      this.escHandler = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          view.dispatch({ effects: toggleSheetEffect.of(false) });
        }
      };
      view.dom.addEventListener('keydown', this.escHandler, true);

      // Trigger animation on next frame
      requestAnimationFrame(() => {
        if (this.backdrop) this.backdrop.classList.add('cm-frontmatter-sheet-backdrop-visible');
        if (this.sheet) this.sheet.classList.add('cm-frontmatter-sheet-open');
      });
    }

    close() {
      const view = this.view;

      // Unlock scroll
      view.scrollDOM.style.overflow = '';

      // Remove escape handler
      if (this.escHandler) {
        view.dom.removeEventListener('keydown', this.escHandler, true);
        this.escHandler = null;
      }

      // Animate out
      if (this.sheet) this.sheet.classList.remove('cm-frontmatter-sheet-open');
      if (this.backdrop) this.backdrop.classList.remove('cm-frontmatter-sheet-backdrop-visible');

      // Remove DOM after animation
      const sheet = this.sheet;
      const backdrop = this.backdrop;
      setTimeout(() => {
        sheet?.remove();
        backdrop?.remove();
      }, 200);

      this.sheet = null;
      this.backdrop = null;
      this.contentEl = null;
    }

    buildContent() {
      if (!this.contentEl) return;
      this.contentEl.innerHTML = '';

      const state = this.view.state;
      const blockRanges = state.field(blockRangesField);
      const { frontmatter } = blockRanges;

      if (!frontmatter) {
        // No frontmatter — show empty state with add button
        const empty = document.createElement('div');
        empty.className = 'cm-frontmatter-sheet-empty';
        empty.textContent = 'No frontmatter in this document.';
        this.contentEl.appendChild(empty);

        const addBtn = document.createElement('button');
        addBtn.className = 'cm-frontmatter-sheet-add-btn';
        addBtn.textContent = 'Add Frontmatter';
        addBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.view.dispatch({
            changes: { from: 0, to: 0, insert: '---\n---\n' },
            annotations: allowReadOnlyEdit.of(true),
          });
        });
        this.contentEl.appendChild(addBtn);
        return;
      }

      // Compute content range
      const hasContent = frontmatter.end - frontmatter.start > 1;
      const contentFrom = hasContent
        ? state.doc.line(frontmatter.start + 1).from
        : state.doc.line(frontmatter.start).to + 1;
      const contentTo = hasContent
        ? state.doc.line(frontmatter.end - 1).to
        : contentFrom;

      const yamlLines = [];
      for (let j = frontmatter.start + 1; j < frontmatter.end; j++) {
        yamlLines.push(state.doc.line(j).text);
      }
      const yamlContent = yamlLines.join('\n');
      const blockFrom = state.doc.line(frontmatter.start).from;

      const knownKeys = this.view.state.facet(frontmatterKeysFacet);
      const { dom } = buildFrontmatterPropertyTable(
        yamlContent, contentFrom, contentTo, blockFrom, this.view,
        { knownKeys }
      );
      this.contentEl.appendChild(dom);
    }

    rebuildContent() {
      this.buildContent();
    }

    destroy() {
      if (this.isOpen) {
        if (this.escHandler) {
          this.view.dom.removeEventListener('keydown', this.escHandler, true);
        }
        this.sheet?.remove();
        this.backdrop?.remove();
        this.view.scrollDOM.style.overflow = '';
      }
    }
  }
);
