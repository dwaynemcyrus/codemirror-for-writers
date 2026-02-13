# Changelog

## v1.7.0

### Added
- Typewriter mode: keeps the cursor line vertically centered while typing or navigating. Toggle via `toggleTypewriter()` / toolbar button.
- Focus mode: dims all paragraphs except the one containing the cursor to 25% opacity. Supports multiple cursors and clears on blur. Toggle via `toggleFocusMode()` / toolbar button.
- Toolbar buttons for typewriter mode (≡) and focus mode (◎).
- Exported `typewriterPlugin`, `focusModePlugin` for advanced composition.
- Exported `setTypewriter()`, `isTypewriter()`, `setFocusMode()`, `isFocusMode()` for programmatic control.

### Changed
- Typography overhaul: switched from system sans-serif to Charter serif font stack (`Charter, "Bitstream Charter", "Sitka Text", Cambria, serif`).
- Font size increased from 16px to 17px, line height from 1.6 to 1.75.
- Content padding widened from 20px to 20px 48px for more comfortable reading margins.
- Line padding increased from 2px to 4px.
- Heading colors refined to blue-tinted grays (light) and warm gray progression (dark).
- Horizontal rules now use gradient backgrounds instead of solid borders.
- Blockquote border colors softened (`#c0c8d0` light, `#4a4a5a` dark).
- Blockquote padding-left increased from 12px to 16px.

## v1.6.0

### Added
- Undo/redo, search/replace, and multi-selection toolbar actions.
- Line numbers toggle and scroll-past-end toggle in the toolbar.
- Read-only mode with task toggle exception.

### Changed
- Toolbar update flow to avoid dispatching during active editor updates.
- Demo toolbar and editor wiring for new UX toggles.

### Fixed
- Toolbar initialization crash caused by dispatching inside update cycles.

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
