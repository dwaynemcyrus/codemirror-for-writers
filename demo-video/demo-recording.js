/**
 * Playwright script for recording a demo video of the hybrid markdown editor.
 *
 * This script:
 * 1. Opens the demo with an empty editor (using #empty hash parameter)
 * 2. Types the demo content character by character
 * 3. Clicks the code block, table, and diagram buttons
 *
 * Usage:
 *   npm run dev (in one terminal - runs on http://localhost:5173/)
 *   node demo-recording.js (in another terminal)
 *
 * Or for recording:
 *   npx playwright codegen http://localhost:5173/#empty
 */

import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// The content to type character by character
// Note: After typing "1." and pressing Enter, CodeMirror auto-adds "2.", "3.", etc.
// Note: All items except last have [x], last has [ ] which we check at the end
// Note: "emoticons :smile:" is added at the end of the video to line 2 (before the "...")
const demoContent = `# Hybrid Markdown Editor

*Edit* and **preview** at the same time :tada:!

1. [x] ordered or unordered lists
[x] **bold**, *italic*...
[ ] code, tables and diagrams
`;

// Typing speed (lower = faster)
const TYPING_DELAY = 25; // ms between characters

async function runDemo() {
  console.log('Starting demo recording script...');

  // Launch browser
  const browser = await chromium.launch({
    headless: false, // Set to false to see the browser
    slowMo: 50, // Reduced for faster execution
  });

  const context = await browser.newContext({
    viewport: { width: 850, height: 1080 },
    recordVideo: {
      dir: './demo-video/',
      size: { width: 850, height: 1080 }
    }
  });

  const page = await context.newPage();

  // Navigate to the demo with #empty hash
  console.log('Navigating to demo page with empty editor...');
  await page.goto('http://localhost:5173/#empty');

  // Wait for the editor to be ready
  await page.waitForSelector('.cm-editor', { timeout: 5000 });
  console.log('Editor loaded');

  // Add custom cursor with smooth animation
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = `
      .pw-cursor {
        position: fixed;
        width: 16px;
        height: 16px;
        background: rgba(255, 0, 0, 0.3);
        border: 2px solid red;
        border-radius: 50%;
        pointer-events: none;
        z-index: 999999;
        transform: translate(-50%, -50%);
        transition: left 0.6s ease-out, top 0.6s ease-out, opacity 0.2s;
        opacity: 1;
      }
      .pw-cursor.hidden {
        opacity: 0;
      }
    `;
    document.head.appendChild(style);

    const cursor = document.createElement('div');
    cursor.className = 'pw-cursor';
    cursor.id = 'pw-cursor';
    document.body.appendChild(cursor);

    // Update cursor position on mouse move
    document.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });

    // Expose functions to show/hide cursor
    window.showCursor = () => cursor.classList.remove('hidden');
    window.hideCursor = () => cursor.classList.add('hidden');
  });

  // Helper to animate cursor to an element before clicking
  async function animateToAndClick(locator) {
    // Show cursor
    await page.evaluate(() => window.showCursor());

    // Get element position
    const box = await locator.boundingBox();
    if (box) {
      // Move mouse to element (cursor will animate via CSS transition)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(700); // Wait for animation (matches 0.6s transition)
    }

    // Click
    await locator.click();
  }

  // Click on the editor to focus it
  await animateToAndClick(page.locator('.cm-editor .cm-content'));
  await page.waitForTimeout(300);

  // Hide cursor while typing
  await page.evaluate(() => window.hideCursor());

  // Type the content character by character
  console.log('Typing demo content...');
  for (const char of demoContent) {
    await page.keyboard.type(char, { delay: TYPING_DELAY });
  }

  console.log('Content typed successfully');
  await page.waitForTimeout(500);

  // Continue to add code block, table, diagram
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter'); // Extra newline before code block

  // Click the Code Block button
  console.log('Clicking Code Block button...');
  await animateToAndClick(page.locator('button.cm-md-toolbar-btn[title*="Code Block"]'));
  await page.waitForTimeout(500);

  // Go to absolute end of document and add space for table
  await page.keyboard.press('Meta+ArrowDown');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');

  // Click the Table button
  console.log('Clicking Table button...');
  await animateToAndClick(page.locator('button.cm-md-toolbar-btn[title*="Table"]'));
  await page.waitForTimeout(500);

  // Wait a bit to show the table before moving on
  await page.waitForTimeout(500);

  // Go to absolute end of document (no extra newline - diagram closer to table)
  await page.keyboard.press('Meta+ArrowDown');
  await page.keyboard.press('End');

  // Click the Diagram button
  console.log('Clicking Diagram button...');
  await animateToAndClick(page.locator('button.cm-md-toolbar-btn[title*="Diagram"]'));
  await page.waitForTimeout(500);

  // Go to absolute end of document so diagram renders
  await page.keyboard.press('Meta+ArrowDown');
  await page.keyboard.press('End');

  // Wait a bit to show the diagram code
  await page.waitForTimeout(500);

  // Click on the unchecked checkbox (this moves cursor away, rendering the diagram)
  console.log('Clicking unchecked checkbox...');
  const uncheckedCheckbox = page.locator('input[type="checkbox"]:not(:checked)').first();
  await animateToAndClick(uncheckedCheckbox);
  await page.waitForTimeout(1000);

  // Add "emoticons :smile:" before the "..." on line 2 of the list (last action)
  // Click at end of line 6 (the "*italic*..." line) instead of keyboard navigation
  console.log('Adding emoticons :smile:...');

  // Get the position just before "..." on line 6 (0-indexed: line 5)
  const clickPos = await page.evaluate(() => {
    const lines = document.querySelectorAll('.cm-line');
    const line = lines[5]; // Line 6 (0-indexed)
    if (line) {
      const text = line.textContent || '';
      const dotsIndex = text.lastIndexOf('...');
      if (dotsIndex !== -1) {
        // Create a range to measure the position before "..."
        const range = document.createRange();
        const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
        let charCount = 0;
        let node;
        while ((node = walker.nextNode())) {
          const nodeLength = node.textContent?.length || 0;
          if (charCount + nodeLength >= dotsIndex) {
            // Found the node containing the "..." position
            range.setStart(node, dotsIndex - charCount);
            range.setEnd(node, dotsIndex - charCount);
            const rect = range.getBoundingClientRect();
            return { x: rect.left, y: rect.top + rect.height / 2 };
          }
          charCount += nodeLength;
        }
      }
      // Fallback: end of line
      const rect = line.getBoundingClientRect();
      return { x: rect.right - 30, y: rect.top + rect.height / 2 };
    }
    return null;
  });

  if (clickPos) {
    // Show cursor and animate to position before "..."
    await page.evaluate(() => window.showCursor());
    await page.mouse.move(clickPos.x, clickPos.y);
    await page.waitForTimeout(700); // Wait for cursor animation
    await page.mouse.click(clickPos.x, clickPos.y);
    await page.waitForTimeout(300);
  }

  // Hide cursor while typing
  await page.evaluate(() => window.hideCursor());
  await page.keyboard.type(', emoticons :smile:', { delay: TYPING_DELAY });
  await page.waitForTimeout(500);

  console.log('Demo recording complete!');

  // Move cursor down to give some breathing room at end
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');

  // Wait a bit before closing to see the final result
  await page.waitForTimeout(2000);

  // Close browser and context to finalize video
  await page.close();
  await context.close();
  await browser.close();

  // Find the recorded video and convert to GIF
  console.log('Converting video to GIF...');
  const videoDir = './demo-video/';
  const files = readdirSync(videoDir).filter(f => f.endsWith('.webm'));

  if (files.length > 0) {
    // Get the most recently modified video file
    const videoFile = files
      .map(f => ({ name: f, mtime: statSync(join(videoDir, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime)[0].name;
    const videoPath = join(videoDir, videoFile);
    const gifFile = join(videoDir, 'demo.gif');

    try {
      // Convert webm to gif using ffmpeg with good quality settings (600p width for balance)
      execSync(`ffmpeg -y -i "${videoPath}" -vf "fps=15,scale=600:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "${gifFile}"`, {
        stdio: 'inherit'
      });
      console.log(`GIF saved to: ${gifFile}`);
    } catch (e) {
      console.error('Failed to convert to GIF. Make sure ffmpeg is installed.');
      console.error('Install with: brew install ffmpeg');
    }
  }
}

// Run the demo
runDemo().catch(console.error);
