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

// The content to type character by character
// Note: After typing "1." and pressing Enter, CodeMirror auto-adds "2.", "3.", etc.
const demoContent = `# Hybrid Markdown Editor

*Edit* and **preview** markdown at the same time :tada:!

## Features

1. ordered or unordered lists
[ ] with tasks
**bold**, *italic*, etc...
emoticons :smile:
code, tables and diagrams
`;

async function runDemo() {
  console.log('Starting demo recording script...');
  
  // Launch browser
  const browser = await chromium.launch({
    headless: false, // Set to false to see the browser
    slowMo: 100, // Slow down actions for better recording
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }, // Good size for demo recording
  });
  
  const page = await context.newPage();
  
  // Add custom cursor styling
  await page.addStyleTag({
    content: `
      .pw-cursor {
        position: fixed;
        width: 12px;
        height: 12px;
        border: 2px solid red;
        border-radius: 50%;
        pointer-events: none;
        z-index: 999999;
        transform: translate(-50%, -50%);
      }
    `
  });
  
  // Add cursor tracking script
  await page.addInitScript(() => {
    const cursor = document.createElement('div');
    cursor.className = 'pw-cursor';
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });
  });
  
  // Navigate to the demo with #empty hash
  console.log('Navigating to demo page with empty editor...');
  await page.goto('http://localhost:5173/#empty');
  
  // Wait for the editor to be ready
  await page.waitForSelector('.cm-editor', { timeout: 5000 });
  console.log('Editor loaded');
  
  // Click on the editor to focus it
  await page.click('.cm-editor .cm-content');
  await page.waitForTimeout(500);
  
  // Type the content character by character
  console.log('Typing demo content character by character...');
  for (const char of demoContent) {
    await page.keyboard.type(char, { delay: 50 }); // 50ms delay between characters
  }
  
  console.log('Content typed successfully');
  await page.waitForTimeout(1000);
  
  // Move to end of document and add newlines to separate sections
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  
  // Click the Code Block button (icon: "{ }")
  console.log('Clicking Code Block button...');
  const codeBlockButton = await page.locator('button.cm-md-toolbar-btn[title*="Code Block"]');
  await codeBlockButton.click();
  await page.waitForTimeout(1000);
  
  // Move cursor below the code block
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  
  // Click the Table button (icon: "⊞")
  console.log('Clicking Table button...');
  const tableButton = await page.locator('button.cm-md-toolbar-btn[title*="Table"]');
  await tableButton.click();
  await page.waitForTimeout(1000);
  
  // Move cursor below the entire table (need to go past all rows)
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  
  // Click the Diagram button (icon: "◇")
  console.log('Clicking Diagram button...');
  const diagramButton = await page.locator('button.cm-md-toolbar-btn[title*="Diagram"]');
  await diagramButton.click();
  await page.waitForTimeout(1000);
  
  // Scroll the editor to show the code block, table, and diagram
  console.log('Scrolling editor to show all content...');
  await page.evaluate(() => {
    const scrollElement = document.querySelector('.cm-scroller');
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  });
  await page.waitForTimeout(2000);
  
  console.log('Demo recording complete!');
  console.log('You can now stop the screen recording.');
  
  // Wait a bit before closing to see the final result
  await page.waitForTimeout(3000);
  
  // Close browser
  await browser.close();
}

// Run the demo
runDemo().catch(console.error);
