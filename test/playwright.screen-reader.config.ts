import { screenReaderConfig } from '@guidepup/playwright'
import { defineConfig, devices } from '@playwright/test'

import baseConfig from './playwright.config.js'

const platform = (() => {
  if (process.platform === 'darwin') {
    return {
      device: devices['Desktop Safari'],
      projectName: 'voiceover-webkit',
    }
  }

  if (process.platform === 'win32') {
    return {
      device: devices['Desktop Firefox'],
      projectName: 'nvda-firefox',
    }
  }

  throw new Error(
    `Screen-reader tests support only macOS with VoiceOver and Windows with NVDA; received ${process.platform}.`,
  )
})()
const screenReaderTestTimeout = 5 * 60 * 1000

export default defineConfig({
  ...baseConfig,
  ...screenReaderConfig,
  projects: [
    {
      name: platform.projectName,
      use: {
        ...platform.device,
        ...baseConfig.use,
        ...screenReaderConfig.use,
      },
    },
  ],
  testMatch: ['a11y/screen-reader.spec.ts'],
  timeout: screenReaderTestTimeout,
  use: {
    ...baseConfig.use,
    ...screenReaderConfig.use,
  },
})
