import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

import { getPayload } from '../packages/payload/src'
import { prettySyncLoggerDestination } from '../packages/payload/src/utilities/logger'
import { bootAdminPanel } from './helpers/bootAdminPanel'
import { startLivePreviewDemo } from './live-preview/startLivePreviewDemo'

dotenv.config()

const [testSuiteDir] = process.argv.slice(4)

/**
 * The default logger's options did not allow for forcing sync logging
 * Using these options, to force both pretty print and sync logging
 */
const prettySyncLogger = {
  loggerDestination: prettySyncLoggerDestination,
  loggerOptions: {},
}

if (!testSuiteDir) {
  console.error('ERROR: You must provide an argument for "testSuiteDir"')
  process.exit(1)
}

const configPath = path.resolve(__dirname, testSuiteDir, 'config.ts')

if (!fs.existsSync(configPath)) {
  console.error('ERROR: You must pass a valid directory under test/ that contains a config.ts')
  process.exit(1)
}

process.env.PAYLOAD_CONFIG_PATH = configPath

// Default to true unless explicitly set to false
if (process.env.PAYLOAD_DROP_DATABASE === 'false') {
  process.env.PAYLOAD_DROP_DATABASE = 'false'
} else {
  process.env.PAYLOAD_DROP_DATABASE = 'true'
}

if (process.argv.includes('--no-auto-login') && process.env.NODE_ENV !== 'production') {
  process.env.PAYLOAD_PUBLIC_DISABLE_AUTO_LOGIN = 'true'
}

const startDev = async () => {
  const payload = await getPayload({
    email: {
      fromAddress: 'hello@payloadcms.com',
      fromName: 'Payload',
      logMockCredentials: false,
    },
    config: require(configPath).default,
    ...prettySyncLogger,
    onInit: (payload) => {
      payload.logger.info('Payload Dev Server Initialized')
    },
  })

  if (testSuiteDir === 'live-preview') {
    await startLivePreviewDemo({
      payload,
    })
  }

  await bootAdminPanel({ appDir: path.resolve(__dirname, '../packages/dev') })

  payload.logger.info(`Admin URL on http://localhost:3000${payload.getAdminURL()}`)
  payload.logger.info(`API URL on http://localhost:3000${payload.getAPIURL()}`)
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
startDev()
