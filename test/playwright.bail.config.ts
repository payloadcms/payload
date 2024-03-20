import type { PlaywrightTestConfig } from '@playwright/test'

import baseConfig from './playwright.config.js'

const config: PlaywrightTestConfig = {
  ...baseConfig,
  maxFailures: 1,
}

export default config
