# Demo Recording Script

This Playwright script automates the process of creating a demo video for the Hybrid Markdown Editor.

## What it does

1. Opens the demo with an empty editor (using the `#empty` hash parameter)
2. Types the following markdown content character by character:
   ```
   # Hybrid Markdown Editor

   *Edit* and **preview** markdown at the same time :tada:!

   ## Features

   1. ordered or unordered lists
   [ ] with tasks
   **bold**, *italic*, etc...
   emoticons :smile:
   code, tables and diagrams
   ```
   Note: After typing "1." and pressing Enter, the editor automatically numbers subsequent items as 2., 3., 4., 5.
3. Clicks the Code Block button
4. Clicks the Table button
5. Clicks the Diagram button

## Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

## Usage

### Option 1: Using the script directly

1. Start the dev server in one terminal:
   ```bash
   npm run dev
   ```

2. In another terminal, run the demo recording script:
   ```bash
   npm run demo:record
   ```

3. Start your screen recording software and watch the automation happen!

### Option 2: Using Playwright Codegen for customization

If you want to customize the script or explore the editor interactively:

```bash
npx playwright codegen http://localhost:5173/#empty
```

This will open a browser window with Playwright's code generator, allowing you to interact with the editor and generate the corresponding Playwright code.

## Hash Parameter

The demo now supports a `#empty` hash parameter to start with an empty editor instead of loading the example content. This is useful for recording demos from scratch.

Examples:
- Normal demo with example content: `http://localhost:5173/`
- Empty editor for recording: `http://localhost:5173/#empty`

## Tips for Recording

- The script runs with `slowMo: 100` to make actions visible in recordings
- Character typing has a 50ms delay between characters for natural appearance
- Adjust `viewport` size in the script to match your desired recording dimensions
- The browser launches in non-headless mode so you can see and record it
