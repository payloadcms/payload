import type { Payload, SanitizedConfig } from 'payload'

import path from 'node:path'
import { getPayload } from 'payload'
import { expect, test as vitestTest } from 'vitest'

import type { DatabaseAdapterType } from '../../dbAdapters.js'

import { getCurrentDatabaseAdapter } from '../../dbAdapters.js'
import { resetAndSeed } from '../shared/clearAndSeed/resetAndSeed.js'
import { getTestDataConfig } from '../shared/clearAndSeed/testDataConfig.js'
import { getSDK } from '../shared/getSDK.js'
import { initPayloadInt } from '../shared/initPayloadInt.js'
import { mongooseList } from '../shared/isMongoose.js'
import { NextRESTClient } from '../shared/NextRESTClient.js'
import { runCLICommand } from '../shared/runCLICommand.js'

type TestOptions = {
  /** Limits the test or suite to the selected database adapters. */
  db?: 'all' | 'drizzle' | 'mongo' | ((adapterType: DatabaseAdapterType) => boolean)
}

type TestSuiteOptions = {
  config?: Promise<SanitizedConfig> | SanitizedConfig
  cron?: boolean
} & TestOptions

type TestConfig = null | Promise<SanitizedConfig> | SanitizedConfig

type IntegrationFixtures = {
  $file: {
    config: SanitizedConfig
    /** Raw file-scoped instance for suite hooks. Tests should use `payload`. */
    payloadInstance: Payload
    testConfig: TestConfig
    testCron: boolean
    testDir: string
    testSuiteConfigured: boolean
  }
  $test: {
    cli: (input: Parameters<typeof runCLICommand>[0]) => ReturnType<typeof runCLICommand>
    payload: Payload
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
    async ({ testConfig, testSuiteConfigured }, use) => {
      if (testSuiteConfigured && testConfig === null) {
        throw new Error(
          'This integration test requires Payload. Pass its config to test.suite({ config: testConfig })(...).',
        )
      }

      const config =
        testConfig !== null
          ? await testConfig
          : (await initPayloadInt(getTestDirectory(), undefined, false)).config

      await use(config)
    },
    { scope: 'file' },
  ],
  payload: async ({ payloadInstance, testSuiteConfigured }, use) => {
    if (testSuiteConfigured) {
      const testDataConfig = getTestDataConfig(payloadInstance.config)

      if (!testDataConfig) {
        throw new Error('Test suite metadata was not registered by buildConfigWithDefaults.')
      }

      await resetAndSeed({ payload: payloadInstance, ...testDataConfig })
    }

    await use(payloadInstance)
  },
  payloadInstance: [
    async ({ config, testCron }, use) => {
      const payload = await getPayload({ config, cron: testCron })

      try {
        await use(payload)
      } finally {
        await payload.destroy()
      }
    },
    { scope: 'file' },
  ],
  restClient: async ({ payload }, use) => {
    await use(new NextRESTClient(payload.config))
  },
  sdk: async ({ payload }, use) => {
    await use(getSDK(payload.config))
  },
  testConfig: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(null)
    },
    { scope: 'file' },
  ],
  testCron: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(true)
    },
    { scope: 'file' },
  ],
  testDir: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(getTestDirectory())
    },
    { scope: 'file' },
  ],
  testSuiteConfigured: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(false)
    },
    { scope: 'file' },
  ],
})

/**
 * Integration test API with Payload's shared lifecycle and database filtering.
 *
 * Payload-backed test files supply their config to one root `test.suite`. Payload is initialized
 * lazily, once per file, and destroyed afterward. Before every test that uses Payload, REST, or the
 * SDK, the database and upload directories are reset and the suite's optional seed function is run.
 * REST and SDK clients are recreated per test. Standalone integration tests use `test.suite({})` and
 * do not initialize Payload.
 *
 * @example
 * import testConfig from './config.js'
 *
 * test.suite({ config: testConfig })('Posts', () => {
 *   test('reads posts', async ({ payload }) => {
 *     await payload.find({ collection: 'posts' })
 *   })
 * })
 */
export const test = Object.assign(testWithFixtures, {
  options: (options: TestOptions) => {
    const shouldRun = matchesDatabase(options)

    return Object.assign(testWithFixtures.runIf(shouldRun), {
      describe: testWithFixtures.describe.runIf(shouldRun),
    })
  },
  suite: ({ config, cron = true, db }: TestSuiteOptions) => {
    testWithFixtures.override('testConfig', config ?? null)
    testWithFixtures.override('testCron', cron)
    testWithFixtures.override('testSuiteConfigured', true)

    return testWithFixtures.describe.runIf(matchesDatabase({ db }))
  },
})

export const it = test

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
