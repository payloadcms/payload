import baseConfig from './playwright.config.js'

/**
 * Playwright configuration for E2E tests with coverage enabled.
 * Extends the base config and adds coverage-specific setup.
 */
export default {
  ...baseConfig,
  globalSetup: './playwright-coverage-setup.ts',
}
