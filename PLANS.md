# PLANS

## Feature: Custom Task Types (Initial Pass)

Plan
1. Align API and behavior: add `enableCustomTasks` and `customTaskTypes` options, default cycle order `[ ] -> [x] -> [i] -> [!] -> [?] -> [*] -> [>] -> [<]`, list-item-only detection, emoji mapping, and non-breaking defaults.
2. Implement custom task rendering and click-to-cycle in the library preview pipeline while preserving existing standard task behavior when the feature is disabled.
3. Style custom task visuals for light and dark themes without changing existing layout or typography.
4. Update the `demo/` app to enable custom tasks and showcase the new markers in the example content.
5. Update tests and package metadata (rename package to `codemirror-for-writers`) to reflect the new behavior and publishing target.
6. Run verification: lint/typecheck (if available), `npm run test`, and `npm run build:lib`/`npm run build`.

Expected Files
- package.json
- README.md
- lib/extensions/hybrid-preview.js
- lib/utils/markdown.js
- lib/theme/base.js
- demo/main.js
- demo/public/example.md
- demo/styles.css
- tests/editor.spec.js

Risks
- Changing task parsing could affect existing list rendering if detection is too broad.
- Emoji rendering varies by OS; ensure layout tolerates different glyph sizes.
- Package rename may require updates to demo imports and documentation.

Verification
- `npm run test`
- `npm run build:lib`
- `npm run build`
- Lint/typecheck scripts (if present in package.json)

---

## Feature: Markdown Extensions (Preview Rendering)

Plan
1. Confirm parsing/rendering strategy for each extension (superscript, subscript, highlight, strikethrough, heading IDs, definition lists, footnotes, emoji). Note: toolbar buttons/keybindings are deferred; list missing toolbar buttons for later.
2. Update markdown parsing/rendering in `lib/utils/markdown.js` to support:
   - `==highlight==`
   - `~subscript~`
   - `^superscript^`
   - Footnote refs/defs with multi-line definitions
   - Heading IDs via `### Heading [#id]`
   - Definition lists (term + `: definition`, multiple defs)
   - Full emoji shortcode coverage (library; ask for approval before adding)
3. Extend hybrid preview rendering (if needed) to surface the new syntaxes consistently in unfocused lines.
4. Update demo content to showcase new syntaxes.
5. Add Playwright coverage for the new preview behaviors.
6. Run verification: `npm run test`, `npm run build:lib`, `npm run build`.

Expected Files
- PLANS.md
- lib/utils/markdown.js
- lib/theme/base.js
- lib/extensions/hybrid-preview.js
- demo/public/example.md
- tests/editor.spec.js
- package.json (if emoji library added)
- package-lock.json (if emoji library added)

Risks
- Regex-based parsing can conflict between inline syntaxes (e.g., `~` in strikethrough vs subscript).
- Full emoji shortcode coverage requires a dependency; size/perf tradeoffs.
- Multi-line footnotes and definition lists require careful line parsing to avoid breaking existing preview logic.

Verification
- `npm run test`
- `npm run build:lib`
- `npm run build`

Deferred Toolbar/Keybindings
- Highlight (`==text==`)
- Subscript (`~text~`)
- Superscript (`^text^`)
- Footnotes (`[^id]` / `[^id]:`)
- Heading IDs (`### Heading [#id]`)
- Definition Lists (term + `: definition`)
- Emoji shortcodes (full coverage)
- Wiki links (`[[title]]`, `[[title|alias]]`, `[[title#section]]`, `[[title#section|alias]]`)

---

## Feature: Markdown-it Migration (Full Replacement)

Plan
1. Replace `marked` with `markdown-it` for inline and document rendering, preserving current HTML/CSS output as closely as possible.
2. Add `markdown-it-emoji` for shortcode support and implement custom inline rules for highlight, subscript, superscript, inline math, and footnote references.
3. Update heading ID parsing to support both `[#id]` and `{#id}`.
4. Ensure block preview widgets (definition lists, footnotes, tables) continue to render with the new inline renderer.
5. Update demo content (include `:tent:` emoji) and adjust tests if needed.
6. Run verification: `npm run test`, `npm run build:lib`, `npm run build`.

Expected Files
- PLANS.md
- package.json
- package-lock.json
- lib/utils/markdown.js
- lib/extensions/hybrid-preview.js
- demo/public/example.md
- tests/editor.spec.js

Risks
- Inline parsing differences may slightly affect preview alignment.
- Custom inline rules could conflict with markdown-it defaults if not ordered carefully.

Verification
- `npm run test`
- `npm run build:lib`
- `npm run build`

---

## Feature: Wiki Links (Parsing + Preview + Demo Autocomplete)

Plan
1. Add a strict wiki-link parser and markdown-it inline rule for `[[title]]`, `[[title|alias]]`, `[[title#section]]`, and `[[title#section|alias]]` with no nesting and no leading/trailing spaces.
2. Wire preview rendering to output styled wiki-link spans and include data attributes for app-level click handling.
3. Add hybrid-mode decorations to highlight wiki links in raw (focused) lines while skipping code blocks and inline code.
4. Expose `enableWikiLinks`, `renderWikiLinks`, and `onWikiLinkClick` options in `hybridMarkdown`/`hybridPreview`, defaulting to off.
5. Add a demo-only autocomplete plugin that uses a note index and insertion formatting, and enable wiki links in the demo.
6. Update README/PLANS and demo content to document/illustrate wiki links and the app-layer plugin split.
7. Add Playwright coverage for wiki-link rendering and inline-code exclusion.
8. Run verification: `npm run test`, `npm run build:lib`, `npm run build`.

Expected Files
- PLANS.md
- README.md
- lib/utils/markdown.js
- lib/extensions/hybrid-preview.js
- lib/theme/base.js
- lib/theme/light.js
- lib/theme/dark.js
- src/utils/markdown.js
- src/styles/preview.css
- src/styles/editor.css
- demo/main.js
- demo/wiki-link-autocomplete.js
- demo/public/example.md
- tests/editor.spec.js
- package.json
- package-lock.json

Risks
- Regex/scanner-based parsing could mis-handle edge cases; strict rules mitigate ambiguity.
- Inline rendering changes may affect perceived alignment for complex lines.

Verification
- `npm run test`
- `npm run build:lib`
- `npm run build`

---

## Feature: Undo/Redo Toolbar Buttons

Plan
1. Add undo/redo actions to toolbar action modules and wire them into both demo and app toolbars.
2. Insert undo/redo buttons at the far left of each toolbar with `↶`/`↷` icons.
3. Disable undo/redo buttons when history depth is zero, updating state on editor transactions.
4. Add styles for disabled toolbar buttons in both demo and app CSS.
5. Add Playwright coverage for undo/redo toolbar behavior.
6. Run verification: `npm run test`, `npm run build:lib`, `npm run build`.

Expected Files
- PLANS.md
- lib/extensions/actions.js
- demo/toolbar.js
- src/toolbar/actions.js
- src/toolbar/index.js
- src/toolbar/toolbar.css
- tests/editor.spec.js

Risks
- Toolbar state updates must stay in sync with editor history changes.

Verification
- `npm run test`
- `npm run build:lib`
- `npm run build`

---

## Feature: Search + Replace Panels

Plan
1. Add `@codemirror/search` dependency and enable `search()` + `searchKeymap` in both library and app editor stacks.
2. Add `search` and `replace` actions that open CodeMirror’s panels.
3. Add Search/Replace buttons to both toolbars near undo/redo.
4. Update README actions list.
5. Add Playwright coverage for opening the search and replace panels.
6. Run verification: `npm run test`, `npm run build:lib`, `npm run build`.

Expected Files
- package.json
- package-lock.json
- lib/index.js
- src/editor/index.js
- lib/extensions/actions.js
- src/toolbar/actions.js
- demo/toolbar.js
- src/toolbar/index.js
- README.md
- tests/editor.spec.js

Risks
- Search panel styling may not match existing theme; follow-up styling may be needed.

Verification
- `npm run test`
- `npm run build:lib`
- `npm run build`

---

## Feature: Line Numbers Toggle

Plan
1. Add a line-number compartment to the demo and app editors, defaulting off.
2. Add a toolbar toggle button near mode/theme controls in both toolbars.
3. Add pressed-state styling for the app toolbar toggle.
4. Add Playwright coverage for toggling line numbers on/off.
5. Run verification: `npm run test`, `npm run build:lib`, `npm run build`.

Expected Files
- demo/main.js
- demo/toolbar.js
- src/editor/index.js
- src/toolbar/index.js
- src/toolbar/toolbar.css
- tests/editor.spec.js

Risks
- None; uses CM6 built-in line numbers with a compartment toggle.

Verification
- `npm run test`
- `npm run build:lib`
- `npm run build`

---

## Feature: Multiple Selections

Plan
1. Enable rectangular selection and crosshair cursor in both library and app editor stacks.
2. Keep existing keymaps (default + search) to preserve Mod-Alt-Arrow cursor add behavior.
3. Run verification: `npm run test`, `npm run build:lib`, `npm run build`.

Expected Files
- lib/index.js
- src/editor/index.js

Risks
- None; uses CM6 built-in selection features.

Verification
- `npm run test`
- `npm run build:lib`
- `npm run build`

---

## Feature: Multi-Selection Toolbar Actions

Plan
1. Add toolbar actions for selecting next and all occurrences in both demo and app toolbars.
2. Place actions near search/replace buttons.
3. Update README actions list and add Playwright coverage.
4. Run verification: `npm run test`, `npm run build:lib`, `npm run build`.

Expected Files
- lib/extensions/actions.js
- src/toolbar/actions.js
- demo/toolbar.js
- src/toolbar/index.js
- README.md
- tests/editor.spec.js

Risks
- Selection background visibility may vary by theme; tests may need minor adjustment.

Verification
- `npm run test`
- `npm run build:lib`
- `npm run build`
