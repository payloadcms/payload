import { defineConfig } from '@playwright/test'

import baseConfig from './playwright.config.js'

export default defineConfig({
  ...baseConfig,
  workers: 1,
  testMatch: ['a11y/WCAG.audit.spec.ts'],
})
