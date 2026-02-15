/**
 * Create a searchable note index for wiki-link autocomplete.
 *
 * @param {Array<{title: string, aliases?: string[]}>} notes - Array of note objects
 * @returns {{search: (query: string) => Array, resolve: (title: string) => Object|null}} Note index
 *
 * @example
 * const noteIndex = createNoteIndex([
 *   { title: 'Project Plan', aliases: ['Plan'] },
 *   { title: 'Meeting Notes' },
 * ]);
 */
export function createNoteIndex(notes = []) {
  const entries = notes.map((note) => ({
    title: note.title,
    aliases: Array.isArray(note.aliases) ? note.aliases : [],
    normalizedTitle: note.title.toLowerCase(),
    normalizedAliases: Array.isArray(note.aliases)
      ? note.aliases.map((alias) => alias.toLowerCase())
      : [],
  }));

  return {
    search(query) {
      const needle = query.trim().toLowerCase();
      if (!needle) {
        return entries;
      }

      const scored = entries
        .map((entry) => {
          const titleIndex = entry.normalizedTitle.indexOf(needle);
          const aliasIndex = entry.normalizedAliases.length
            ? Math.min(
                ...entry.normalizedAliases
                  .map((alias) => alias.indexOf(needle))
                  .filter((index) => index !== -1)
              )
            : -1;
          const bestIndex = Math.min(
            titleIndex === -1 ? Number.POSITIVE_INFINITY : titleIndex,
            aliasIndex === -1 ? Number.POSITIVE_INFINITY : aliasIndex
          );
          return { entry, score: bestIndex };
        })
        .filter((result) => Number.isFinite(result.score))
        .sort((a, b) => a.score - b.score);

      return scored.map((result) => result.entry);
    },

    resolve(title) {
      const needle = title.trim().toLowerCase();
      return (
        entries.find((entry) => entry.normalizedTitle === needle) ||
        entries.find((entry) => entry.normalizedAliases.includes(needle)) ||
        null
      );
    },
  };
}

function defaultFormatLink(note) {
  return `${note.title}]]`;
}

/**
 * Resolve a wiki link against a note index.
 *
 * @param {Object} noteIndex - Index created by createNoteIndex
 * @param {{title: string}} link - Wiki link object
 * @returns {Object|null} Matched note entry or null
 */
export function resolveWikiLink(noteIndex, link) {
  if (!noteIndex || !link || !link.title) return null;
  return noteIndex.resolve(link.title);
}

/**
 * Create a wiki-link completion source for use with @codemirror/autocomplete.
 * Triggers after typing `[[` and provides note title suggestions.
 *
 * Returns a completion source function — combine with other sources
 * in a single `autocompletion({ override: [...] })` call.
 *
 * @param {Object} options
 * @param {Object} options.noteIndex - Index created by createNoteIndex
 * @param {(note: Object) => string} [options.formatLink] - Custom link formatter
 * @returns {CompletionSource} A completion source function
 *
 * @example
 * import { autocompletion } from '@codemirror/autocomplete';
 * import { createNoteIndex, wikiLinkAutocomplete } from 'codemirror-for-writers';
 *
 * const noteIndex = createNoteIndex([{ title: 'My Note' }]);
 * const extensions = [
 *   autocompletion({ override: [wikiLinkAutocomplete({ noteIndex })] }),
 * ];
 */
export function wikiLinkAutocomplete({ noteIndex, formatLink } = {}) {
  const format = typeof formatLink === 'function' ? formatLink : defaultFormatLink;

  return (context) => {
    if (!noteIndex) return null;
    const match = context.matchBefore(/\[\[[^\[\]\n]*$/);
    if (!match) return null;

    const query = match.text.slice(2);
    const results = noteIndex.search(query);
    const options = results.map((note) => ({
      label: note.title,
      detail: note.aliases.length ? `aliases: ${note.aliases.join(', ')}` : undefined,
      apply: format(note),
      type: 'text',
    }));

    return {
      from: match.from + 2,
      to: match.to,
      options,
      validFor: /^[^\[\]\n]*$/,
    };
  };
}
