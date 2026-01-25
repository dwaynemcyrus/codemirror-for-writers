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
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: false, // Run in headed mode by default for recording
  },
});
