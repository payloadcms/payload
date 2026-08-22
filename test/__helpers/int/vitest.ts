import type { Payload, SanitizedConfig } from 'payload'

import path from 'node:path'
import { getPayload } from 'payload'
import { expect, test as vitestTest } from 'vitest'

import type { DatabaseAdapterType } from '../../dbAdapters.js'

import { getCurrentDatabaseAdapter } from '../../dbAdapters.js'
import { getSDK } from '../shared/getSDK.js'
import { initPayloadInt } from '../shared/initPayloadInt.js'
import { mongooseList } from '../shared/isMongoose.js'
import { NextRESTClient } from '../shared/NextRESTClient.js'
import { runCLICommand } from '../shared/runCLICommand.js'

type TestOptions = {
  /** Limits the test or suite to the selected database adapters. */
  db?: 'all' | 'drizzle' | 'mongo' | ((adapterType: DatabaseAdapterType) => boolean)
}

type IntegrationFixtures = {
  $file: {
    config: SanitizedConfig
    payload: Payload
    testDir: string
  }
  $test: {
    cli: (input: Parameters<typeof runCLICommand>[0]) => ReturnType<typeof runCLICommand>
    restClient: NextRESTClient
    sdk: ReturnType<typeof getSDK>
  }
}

// Keep all fixtures in one extension so Vitest can trace test calls back to their source lines.
const testWithFixtures = vitestTest.extend<IntegrationFixtures>({
  cli: async ({ testDir }, use) => {
    await use(async (input: Parameters<typeof runCLICommand>[0]) => {
      const configPath = typeof input === 'string' ? undefined : input.configPath

      await initPayloadInt(testDir, undefined, false, configPath)

      return runCLICommand(input, { cwd: testDir })
    })
  },
  config: [
    async ({ testDir }, use) => {
      const { config } = await initPayloadInt(testDir, undefined, false)

      await use(config)
    },
    { scope: 'file' },
  ],
  payload: [
    async ({ config }, use) => {
      const payload = await getPayload({ config, cron: true })

      await use(payload)
      await payload.destroy()
    },
    { scope: 'file' },
  ],
  restClient: async ({ payload }, use) => {
    await use(new NextRESTClient(payload.config))
  },
  sdk: async ({ payload }, use) => {
    await use(getSDK(payload.config))
  },
  testDir: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(getTestDirectory())
    },
    { scope: 'file' },
  ],
})

/**
 * Integration test API with Payload's shared fixtures and database filtering.
 *
 * `config`, `payload`, and `testDir` are shared for the test file. `payload` is destroyed
 * automatically after the file finishes. Clients are new for every test so
 * authentication and other mutable state cannot leak into the next test.
 *
 * @example
 * test.options({ db: 'mongo' })('MongoDB only', async ({ payload }) => {
 *   await payload.find({ collection: 'posts' })
 * })
 *
 * @example
 * test.options({ db: 'drizzle' }).describe('Drizzle only', () => {
 *   test('works', async ({ payload }) => { ... })
 * })
 */
export const test = Object.assign(testWithFixtures, {
  options: (options: TestOptions) => {
    const shouldRun = matchesDatabase(options)

    return Object.assign(testWithFixtures.runIf(shouldRun), {
      describe: testWithFixtures.describe.runIf(shouldRun),
    })
  },
})

const getTestDirectory = (): string => {
  const testPath = expect.getState().testPath

  if (!testPath) {
    throw new Error('Could not determine the integration test file path.')
  }

  return path.dirname(testPath)
}

const isMongo = mongooseList.includes(process.env.PAYLOAD_DATABASE!)

const matchesDatabase = ({ db = 'all' }: TestOptions = {}): boolean => {
  if (typeof db === 'function') {
    return db(getCurrentDatabaseAdapter())
  }

  if (db === 'mongo') {
    return isMongo
  }

  if (db === 'drizzle') {
    return !isMongo
  }

  return true
}

export { isMongo }
