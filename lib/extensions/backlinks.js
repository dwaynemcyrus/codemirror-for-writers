/**
 * Backlinks / Linked Mentions Panel
 *
 * A bottom panel showing incoming links to the current document.
 * The consumer provides an async resolver that returns backlink data.
 */

import { showPanel } from '@codemirror/view';
import { Facet } from '@codemirror/state';

/**
 * Configuration facet for backlinks panel
 */
export const backlinksFacet = Facet.define({
  combine(values) {
    if (values.length === 0) {
      return { docTitle: null, onBacklinksRequested: null, onBacklinkClick: null };
    }
    return values[values.length - 1];
  },
});

/**
 * Extract the title from YAML frontmatter in the document
 */
function extractFrontmatterTitle(doc) {
  if (doc.lines < 2) return null;
  const firstLine = doc.line(1).text.trim();
  if (firstLine !== '---') return null;

  for (let i = 2; i <= doc.lines; i++) {
    const text = doc.line(i).text.trim();
    if (text === '---' || text === '...') {
      // Found end of frontmatter, now look for title in lines 2..(i-1)
      for (let j = 2; j < i; j++) {
        const line = doc.line(j).text;
        const match = line.match(/^title:\s*(.+)$/);
        if (match) {
          let title = match[1].trim();
          // Strip quotes if present
          if ((title.startsWith('"') && title.endsWith('"')) ||
              (title.startsWith("'") && title.endsWith("'"))) {
            title = title.slice(1, -1);
          }
          return title;
        }
      }
      return null;
    }
  }

  return null;
}

/**
 * Render backlink chips into the panel DOM
 */
function renderBacklinks(dom, backlinks, onBacklinkClick) {
  dom.textContent = '';

  const label = document.createElement('span');
  label.className = 'cm-backlinks-label';
  label.textContent = 'Backlinks';
  dom.appendChild(label);

  if (!backlinks || backlinks.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'cm-backlinks-empty';
    empty.textContent = 'None';
    dom.appendChild(empty);
    return;
  }

  const list = document.createElement('span');
  list.className = 'cm-backlinks-list';

  for (const backlink of backlinks) {
    const chip = document.createElement('span');
    chip.className = 'cm-backlinks-link';
    chip.textContent = backlink.title;
    if (backlink.excerpt) {
      chip.title = backlink.excerpt;
    }
    chip.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (onBacklinkClick) {
        onBacklinkClick(backlink);
      }
    });
    list.appendChild(chip);
  }

  dom.appendChild(list);
}

/**
 * Create the backlinks panel
 */
function backlinksPanelFactory(view) {
  const dom = document.createElement('div');
  dom.className = 'cm-backlinks-panel';

  const config = view.state.facet(backlinksFacet);
  let lastTitle = null;
  let currentRequest = 0;

  function resolveTitle(state) {
    const config = state.facet(backlinksFacet);
    if (config.docTitle) return config.docTitle;
    return extractFrontmatterTitle(state.doc);
  }

  async function fetchBacklinks(state) {
    const config = state.facet(backlinksFacet);
    if (!config.onBacklinksRequested) {
      dom.textContent = '';
      return;
    }

    const title = resolveTitle(state);
    if (title === lastTitle) return;
    lastTitle = title;

    if (!title) {
      renderBacklinks(dom, [], config.onBacklinkClick);
      return;
    }

    // Show loading state
    dom.textContent = '';
    const loadingLabel = document.createElement('span');
    loadingLabel.className = 'cm-backlinks-label';
    loadingLabel.textContent = 'Backlinks';
    dom.appendChild(loadingLabel);
    const loading = document.createElement('span');
    loading.className = 'cm-backlinks-empty';
    loading.textContent = 'Loading\u2026';
    dom.appendChild(loading);

    const requestId = ++currentRequest;

    try {
      const backlinks = await config.onBacklinksRequested(title);
      // Only render if this is still the latest request
      if (requestId === currentRequest) {
        renderBacklinks(dom, backlinks, config.onBacklinkClick);
      }
    } catch {
      if (requestId === currentRequest) {
        renderBacklinks(dom, [], config.onBacklinkClick);
      }
    }
  }

  // Initial fetch
  fetchBacklinks(view.state);

  return {
    dom,
    top: false,
    update(update) {
      if (update.docChanged) {
        fetchBacklinks(update.state);
      }
    },
  };
}

/**
 * The backlinks panel extension.
 * Use with a Compartment for toggling.
 *
 * Requires backlinksFacet to be configured with onBacklinksRequested callback.
 */
export const backlinksPanel = showPanel.of(backlinksPanelFactory);
