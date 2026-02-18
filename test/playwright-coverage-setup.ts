import type { FullConfig } from '@playwright/test'

import fs from 'fs'
import path from 'path'

/**
 * Global setup for Playwright that prepares coverage collection.
 * This runs once before all tests.
 */
const globalSetup = (config: FullConfig) => {
  const coverageDir = path.resolve(process.cwd(), 'coverage/e2e')

  // Clean up any existing e2e coverage
  if (fs.existsSync(coverageDir)) {
    fs.rmSync(coverageDir, { force: true, recursive: true })
  }

  // Create fresh coverage directory
  fs.mkdirSync(coverageDir, { recursive: true })

  console.log('📊 E2E Coverage collection enabled')
  console.log(`   Coverage will be saved to: ${coverageDir}`)

  // Set environment variable to signal dev server to enable instrumentation
  process.env.ENABLE_COVERAGE = 'true'
}

// eslint-disable-next-line no-restricted-exports
export default globalSetup
