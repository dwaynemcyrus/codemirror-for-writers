import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for demo recording
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'demo-recording.js',
  timeout: 120000, // 2 minutes for the whole recording
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Run tests in headed mode by default for recording
  use: {
    headless: false,
  },
});
