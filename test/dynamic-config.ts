/* eslint-disable no-restricted-exports */

import { staticConfigImports } from './config-imports.js'

if (!process.env.PAYLOAD_CONFIG_PATH) {
  throw new Error('PAYLOAD_CONFIG_PATH environment variable is required')
}

// Extract the suite name from the path
const suiteName = process.env.PAYLOAD_CONFIG_PATH.split('/').slice(
  -2,
)[0] as keyof typeof staticConfigImports

if (!(suiteName in staticConfigImports)) {
  throw new Error(
    `Unknown test suite: ${suiteName}. This error should have been 
caught several seconds earlier in dev.ts.`,
  )
}

const config = await staticConfigImports[suiteName]()
export default config.default
