import { test, expect } from '@playwright/test';

test.describe('Hybrid Markdown Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#empty');
    await page.waitForSelector('.cm-editor');
  });

  test('should load the editor', async ({ page }) => {
    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect(page.locator('.cm-content')).toBeVisible();
  });

  test('should have toolbar with buttons', async ({ page }) => {
    await expect(page.locator('.cm-md-toolbar')).toBeVisible();
    await expect(page.locator('.cm-md-toolbar-btn').first()).toBeVisible();
  });

  test('should accept text input', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('Hello World');
    await expect(page.locator('.cm-content')).toContainText('Hello World');
  });

  test('should render header preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('# Hello');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Some text');

    // Click away to unfocus the header line
    await page.locator('.cm-content').click();
    await page.keyboard.press('ArrowDown');

    // Header should be rendered as preview
    await expect(page.locator('.cm-markdown-preview .md-h1')).toBeVisible();
  });

  test('should show raw markdown when line is focused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('**bold text**');

    // When focused, should show raw markdown
    await expect(page.locator('.cm-content')).toContainText('**bold text**');
  });

  test('should render bold preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('**bold text**');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    // Move away from the bold line
    await expect(page.locator('.cm-markdown-preview strong')).toBeVisible();
  });

  test('should render italic preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('*italic text*');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    await expect(page.locator('.cm-markdown-preview em')).toBeVisible();
  });

  test('should render link preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('[link](https://example.com)');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    await expect(page.locator('.cm-markdown-preview a')).toBeVisible();
  });

  test('should render inline code preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('Use `code` here');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    await expect(page.locator('.cm-markdown-preview code')).toBeVisible();
  });

  test('should style code blocks', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('```javascript');
    await page.keyboard.press('Enter');
    await page.keyboard.type('const x = 1;');
    await page.keyboard.press('Enter');
    await page.keyboard.type('```');
    await page.keyboard.press('Enter');
    await page.keyboard.type('text after');

    await expect(page.locator('.cm-code-block-line')).toBeVisible();
  });

  test('should render table preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('| A | B |');
    await page.keyboard.press('Enter');
    await page.keyboard.type('|---|---|');
    await page.keyboard.press('Enter');
    await page.keyboard.type('| 1 | 2 |');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('text after table');

    await expect(page.locator('.md-table')).toBeVisible();
  });

  test('should render blockquote preview when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('> This is a quote');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    await expect(page.locator('.cm-markdown-preview .md-blockquote')).toBeVisible();
  });

  test('should render list items when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('- Item 1');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- Item 2');
    await page.keyboard.press('Enter');
    await page.keyboard.type('text after');

    await expect(page.locator('.cm-markdown-preview .md-list-marker').first()).toBeVisible();
  });

  test('should render highlight when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('==highlighted==');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    await expect(page.locator('.cm-markdown-preview .md-highlight')).toBeVisible();
  });

  test('should render subscript when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('H~2~O');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    await expect(page.locator('.cm-markdown-preview .md-subscript')).toBeVisible();
  });

  test('should render superscript when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('x^2^');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    await expect(page.locator('.cm-markdown-preview .md-superscript')).toBeVisible();
  });

  test('should render heading IDs when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('### Heading [#heading-id]');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    await expect(page.locator('.cm-markdown-preview [data-heading-id="heading-id"]')).toBeVisible();
  });

  test('should render definition lists when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('Term One');
    await page.keyboard.press('Enter');
    await page.keyboard.type(': First definition');
    await page.keyboard.press('Enter');
    await page.keyboard.type(': Second definition');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    await expect(page.locator('.cm-definition-list-preview .md-definition-list')).toBeVisible();
  });

  test('should render multi-line footnotes when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('Footnote ref[^note]');
    await page.keyboard.press('Enter');
    await page.keyboard.type('[^note]: First line');
    await page.keyboard.press('Enter');
    await page.keyboard.type('  Second line');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    await expect(page.locator('.cm-footnote-preview .md-footnote-block')).toBeVisible();
  });

  test('should render custom task icons when unfocused', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('- [i] Info task');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    await expect(page.locator('.cm-markdown-preview .md-task-icon[data-task="i"]')).toBeVisible();
  });

  test('should cycle custom task types on click', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.type('- [x] Cycle task');
    await page.keyboard.press('Enter');
    await page.keyboard.type('next line');

    const taskIcon = page.locator('.cm-markdown-preview .md-task-icon.md-task-complete').first();
    await taskIcon.click();

    // Focus the line to reveal raw markdown
    await page.locator('.cm-markdown-preview').first().click();
    await expect(page.locator('.cm-content')).toContainText('[i] Cycle task');
  });
});

test.describe('Toolbar Actions', () => {
  // Use platform-specific modifier for select-all
  const selectAllKey = process.platform === 'darwin' ? 'Meta+a' : 'Control+a';

  test.beforeEach(async ({ page }) => {
    await page.goto('/#empty');
    await page.waitForSelector('.cm-editor');
    await page.locator('.cm-content').click();
  });

  test('should insert bold markers with toolbar button', async ({ page }) => {
    // Type some text and select it
    await page.keyboard.type('text');
    await page.keyboard.press(selectAllKey);
    await page.locator('.cm-md-toolbar-btn[title="Bold (Ctrl+B)"]').click();
    await expect(page.locator('.cm-content')).toContainText('**text**');
  });

  test('should insert italic markers with toolbar button', async ({ page }) => {
    // Type some text and select it - italic uses underscores
    await page.keyboard.type('text');
    await page.keyboard.press(selectAllKey);
    await page.locator('.cm-md-toolbar-btn[title="Italic (Ctrl+I)"]').click();
    await expect(page.locator('.cm-content')).toContainText('_text_');
  });

  test('should insert heading prefix with toolbar button', async ({ page }) => {
    await page.keyboard.type('Title');
    await page.locator('.cm-md-toolbar-btn[title="Heading 1"]').click();
    await expect(page.locator('.cm-content')).toContainText('# Title');
  });

  test('should insert code block with toolbar button', async ({ page }) => {
    await page.locator('.cm-md-toolbar-btn[title="Code Block"]').click();
    await expect(page.locator('.cm-content')).toContainText('```');
  });

  test('should insert table with toolbar button', async ({ page }) => {
    await page.locator('.cm-md-toolbar-btn[title="Table"]').click();
    await expect(page.locator('.cm-content')).toContainText('| Column 1 |');
  });

  test('should insert link with toolbar button', async ({ page }) => {
    await page.locator('.cm-md-toolbar-btn[title="Link (Ctrl+K)"]').click();
    await expect(page.locator('.cm-content')).toContainText('[link text]');
  });

  test('should insert horizontal rule with toolbar button', async ({ page }) => {
    // Type some text first, then add HR after the line
    await page.keyboard.type('Some text');
    await page.locator('.cm-md-toolbar-btn[title="Horizontal Rule"]').click();
    // HR is rendered as an actual <hr> element in the preview
    await expect(page.locator('.cm-markdown-preview hr, .md-hr')).toBeVisible();
  });

  test('should insert bullet list with toolbar button', async ({ page }) => {
    await page.locator('.cm-md-toolbar-btn[title="Bullet List"]').click();
    await expect(page.locator('.cm-content')).toContainText('- ');
  });
});

test.describe('Theme and Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.cm-editor');
  });

  test('should toggle raw mode with toolbar button', async ({ page }) => {
    const rawModeBtn = page.locator('.cm-md-toolbar-btn[title="Raw Mode"]');
    await expect(rawModeBtn).toBeVisible();

    // Click to enable raw mode
    await rawModeBtn.click();

    // Button should be pressed
    await expect(rawModeBtn).toHaveClass(/cm-md-toolbar-btn-pressed/);

    // Click again to disable
    await rawModeBtn.click();

    // Button should not be pressed
    await expect(rawModeBtn).not.toHaveClass(/cm-md-toolbar-btn-pressed/);
  });

  test('should toggle theme when toggling raw mode', async ({ page }) => {
    const rawModeBtn = page.locator('.cm-md-toolbar-btn[title="Raw Mode"]');

    // Get initial state
    const initialDark = await page.locator('body').evaluate(el => el.classList.contains('dark-mode'));

    // Toggle raw mode (which also toggles theme)
    await rawModeBtn.click();

    // Check theme changed
    const newDark = await page.locator('body').evaluate(el => el.classList.contains('dark-mode'));
    expect(newDark).toBe(!initialDark);
  });
});

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#empty');
    await page.waitForSelector('.cm-editor');
    await page.locator('.cm-content').click();
  });

  // Use platform-specific modifier (Meta on Mac, Control elsewhere)
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';

  test('should insert bold with keyboard shortcut', async ({ page }) => {
    await page.keyboard.type('text');
    await page.keyboard.press(`${modifier}+a`);
    await page.keyboard.press(`${modifier}+b`);
    await expect(page.locator('.cm-content')).toContainText('**text**');
  });

  test('should insert italic with keyboard shortcut', async ({ page }) => {
    await page.keyboard.type('text');
    await page.keyboard.press(`${modifier}+a`);
    await page.keyboard.press(`${modifier}+i`);
    // Italic uses underscores
    await expect(page.locator('.cm-content')).toContainText('_text_');
  });

  test('should insert link with keyboard shortcut', async ({ page }) => {
    await page.keyboard.type('text');
    await page.keyboard.press(`${modifier}+a`);
    await page.keyboard.press(`${modifier}+k`);
    // Link wraps selection with full URL
    await expect(page.locator('.cm-content')).toContainText('[text](https://example.com)');
  });

  test('should undo with keyboard shortcut', async ({ page }) => {
    await page.keyboard.type('Hello');
    await expect(page.locator('.cm-content')).toContainText('Hello');

    await page.keyboard.press(`${modifier}+z`);
    // After undo, the content should be empty or have less text
    const content = await page.locator('.cm-content').textContent();
    expect(content?.includes('Hello')).toBe(false);
  });
});
