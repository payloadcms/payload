import type { PlaywrightTestConfig } from '@playwright/test'

import baseConfig from './playwright.config'

const config: PlaywrightTestConfig = {
  ...baseConfig,
  maxFailures: 1,
}

export default config
