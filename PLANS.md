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
