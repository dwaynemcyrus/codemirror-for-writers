# Upgrades Roadmap

Feature recommendations for combining Bear's writing experience, Obsidian's properties, and iA Writer's writing modes.

## Implemented

- [x] **Typewriter Mode** - Keep the active line vertically centered as you type *(v1.7.0)*
- [x] **Focus Mode** - Dim all text except the current paragraph to 25% opacity *(v1.7.0)*
- [x] **Typography & Spacing Overhaul** - Charter serif font, 17px/1.75 line height, wider margins, refined heading colors, gradient HRs *(v1.7.0)*
- [x] **YAML Frontmatter / Properties Editor** - Obsidian-style key-value table with inline editing, js-yaml round-trip *(v1.8.0)*
- [x] **Word/Character/Reading Time Counter** - Toggleable status bar with live word, character, and reading time stats *(v1.8.0)*
- [x] **Inline Image Preview** - Render `![alt](url)` as actual images with lazy loading and error handling *(v1.9.0)*
- [x] **Tag System with Autocomplete** - `#tag` and `#tag/subtag` rendered as styled pills, with completion source API *(v1.9.0)*
- [x] **Smooth Preview Transitions** - CSS fade-in animations on preview/focus state changes *(v1.9.0)*
- [x] **Link Autocomplete Enhancement** - Wiki-link autocomplete promoted to first-class library export *(v1.9.0)*
- [x] **Backlinks / Linked Mentions API** - Bottom panel with async `onBacklinksRequested(docTitle)` resolver *(v1.9.0)*
- [x] **More Menu** - `moreMenu()` extension: top-right `⋯` button with dropdown toggles for theme, mode, read-only, typewriter, focus, word count, properties *(v1.10.0)*
- [x] **Bottom Toolbar Overscroll Fix** - `overscroll-behavior-x: contain` + JS touchmove fallback prevents iOS swipe-back at scroll edges *(v1.10.0)*

## Not Yet Implemented

### npm Publishing Improvements

| # | Improvement | Notes |
|---|-------------|-------|
| — | TypeScript declarations | Generate `.d.ts` files (via JSDoc or hand-written) and add `"types"` to `package.json`. Enables autocomplete for TS consumers. |
| — | `CHANGELOG.md` in npm tarball | Add `"CHANGELOG.md"` to `files` array so consumers can see release notes. |
| — | Provenance attestation | Run `npm publish --provenance` from GitHub Actions for supply-chain trust. |

### Lower Priority

| # | Feature | Effort | Impact | Source |
|---|---------|--------|--------|--------|
| 11 | Colored Heading Indicators | Low | Low | Bear |
| 12 | Inline Hashtag Rendering | Medium | Medium | Bear |
| 13 | Sentence-Level Syntax Awareness | High | Medium | iA Writer |

## Feature Descriptions

**YAML Frontmatter / Properties Editor** - Render YAML as a structured property editor when unfocused, raw YAML when the block is focused. Most architecturally significant addition.

**Word/Character/Reading Time Counter** - Status bar with live writing stats.

**Inline Image Preview** - Render `![alt](url)` as actual images with size constraints when unfocused.

**Tag System with Autocomplete** - Support `#tag` and `#tag/subtag`, render as styled pills, autocomplete from user-supplied list.

**Smooth Preview Transitions** - Animate the switch between raw markdown and rendered preview with CSS transitions.

**Link Autocomplete Enhancement** - Promote wiki-link autocomplete from demo-only to a first-class configurable feature.

**Backlinks / Linked Mentions API** - API for incoming links via `onBacklinksRequested(docTitle)`.

**Colored Heading Indicators** - Small colored dots next to headings for visual hierarchy.

**Inline Hashtag Rendering** - Render `#tags` as colored, clickable pills inline.

**Sentence-Level Syntax Awareness** - Highlight parts of speech, flag long sentences, show sentence boundaries.
