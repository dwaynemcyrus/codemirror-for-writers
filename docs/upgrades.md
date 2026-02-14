# Upgrades Roadmap

Feature recommendations for combining Bear's writing experience, Obsidian's properties, and iA Writer's writing modes.

## Implemented

- [x] **Typewriter Mode** - Keep the active line vertically centered as you type *(v1.7.0)*
- [x] **Focus Mode** - Dim all text except the current paragraph to 25% opacity *(v1.7.0)*
- [x] **Typography & Spacing Overhaul** - Charter serif font, 17px/1.75 line height, wider margins, refined heading colors, gradient HRs *(v1.7.0)*
- [x] **YAML Frontmatter / Properties Editor** - Obsidian-style key-value table with inline editing, js-yaml round-trip *(v1.8.0)*
- [x] **Word/Character/Reading Time Counter** - Toggleable status bar with live word, character, and reading time stats *(v1.8.0)*

## Not Yet Implemented

### High Priority

| # | Feature | Effort | Impact | Source |
|---|---------|--------|--------|--------|
| 6 | Inline Image Preview | Medium | Medium | Bear |

### Medium Priority

| # | Feature | Effort | Impact | Source |
|---|---------|--------|--------|--------|
| 7 | Tag System with Autocomplete | Medium | Medium | Obsidian |
| 8 | Smooth Preview Transitions | Low | Medium | Bear |
| 9 | Link Autocomplete Enhancement | Low | Medium | Obsidian |
| 10 | Backlinks / Linked Mentions API | Medium | Medium | Obsidian |

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
