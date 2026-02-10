# Changelog

## v1.5.0

### Added
- Wiki link parsing/rendering with strict `[[title]]` / `[[title#section]]` / alias formats.
- Hybrid preview styling and click handling for wiki links across line, heading, table, footnote, and definition list previews.
- Demo-only wiki link autocomplete plugin and sample note index.
- Tests for wiki link rendering and click handling in preview blocks.

### Changed
- Hybrid markdown options now include `enableWikiLinks`, `renderWikiLinks`, and `onWikiLinkClick`.
- Documentation updated for wiki link behavior and package naming in docs.
- Demo content updated with wiki link examples.

## v1.4.0

### Added
- Markdown-it renderer with emoji shortcode support.
- Footnotes, heading IDs, definition lists, highlight, subscript, superscript, strikethrough, and inline math rendering.
- Footnote back-reference link in preview.
- Tests covering new markdown extensions.

### Changed
- Preview rendering pipeline now uses markdown-it instead of marked.
- Demo content updated to showcase new markdown features.
- Build externals updated for markdown-it and markdown-it-emoji.
- Dependencies swapped: removed `marked` and `gemoji`, added `markdown-it` and `markdown-it-emoji`.

## v1.3.0

### Added
- Custom task types in hybrid preview with emoji indicators and full-cycle click behavior.
- Demo content updates to showcase custom task types.

### Changed
- Standard task list markers now render as emoji icons in preview for consistent sizing.
- Package renamed to `codemirror-for-writers` with updated repository/demo links and Vite base path.
- Preview styling for task icons and related CSS classes.
- Tests updated to cover custom task rendering and cycling.
