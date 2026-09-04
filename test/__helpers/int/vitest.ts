import type { Payload, SanitizedConfig } from 'payload'

import path from 'node:path'
import { getPayload } from 'payload'
import { expect, test as vitestTest } from 'vitest'

import type { DatabaseAdapterType } from '../../dbAdapters.js'

import { getCurrentDatabaseAdapter } from '../../dbAdapters.js'
import { resetAndSeed } from '../shared/clearAndSeed/resetAndSeed.js'
import { getTestDataConfig } from '../shared/clearAndSeed/testDataConfig.js'
import { getSDK } from '../shared/getSDK.js'
import { mongooseList } from '../shared/isMongoose.js'
import { NextRESTClient } from '../shared/NextRESTClient.js'
import { runCLICommand } from '../shared/runCLICommand.js'

type TestOptions = {
  /** Limits the test or suite to the selected database adapters. */
  db?: 'all' | 'drizzle' | 'mongo' | ((adapterType: DatabaseAdapterType) => boolean)
}

type TestSuiteOptions = {
  config?: string
  cron?: boolean
  /**
   * Set to false for suites that manage their own test isolation. The fixture resets and seeds once
   * before the file's tests, then shares the database state and REST client between those tests.
   */
  resetBetweenTests?: boolean
} & TestOptions

type IntegrationFixtures = {
  $file: {
    config: SanitizedConfig
    configPath: null | string
    /** Raw file-scoped instance for suite hooks. Tests should use `payload`. */
    payloadInstance: Payload
    resetBetweenTests: boolean
    /** Config supplied to `test.suite`, imported automatically before file hooks run. */
    resolvedConfig: null | SanitizedConfig
    /** Raw file-scoped REST client for suites that intentionally share state across tests. */
    restClientInstance: NextRESTClient
    /** Prepares shared test data once for suites that disable resets between tests. */
    seedAtStart: void
    testCron: boolean
    testDir: string
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
  cli: async ({ configPath, payload, testDir }, use) => {
    // Resolving this dependency initializes Payload and resets and seeds the database first.
    void payload

    const previousDropDatabase = process.env.PAYLOAD_DROP_DATABASE

    if (previousDropDatabase !== 'true') {
      throw new Error('The CLI fixture expected PAYLOAD_DROP_DATABASE to be true before setup.')
    }

    // The parent Payload instance already prepared the database. The child CLI process must reuse it.
    process.env.PAYLOAD_DROP_DATABASE = 'false'

    try {
      if (configPath === null) {
        throw new Error(
          "This integration test requires Payload. Pass its config path to test.suite({ config: './config.ts' })(...).",
        )
      }

      await use((input) =>
        runCLICommand(input, {
          configPath,
          cwd: testDir,
        }),
      )
    } finally {
      process.env.PAYLOAD_DROP_DATABASE = previousDropDatabase
    }
  },
  config: [
    async ({ resolvedConfig }, use) => {
      if (resolvedConfig === null) {
        throw new Error(
          "This integration test requires Payload. Pass its config path to test.suite({ config: './config.ts' })(...).",
        )
      }

      await use(resolvedConfig)
    },
    { scope: 'file' },
  ],
  configPath: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(null)
    },
    { scope: 'file' },
  ],
  payload: async ({ payloadInstance, resetBetweenTests }, use) => {
    if (resetBetweenTests) {
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
  resetBetweenTests: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(true)
    },
    { scope: 'file' },
  ],
  resolvedConfig: [
    async ({ configPath }, use) => {
      if (configPath === null) {
        await use(null)
        return
      }

      const { default: config } = (await import(configPath)) as {
        default: Promise<SanitizedConfig> | SanitizedConfig
      }

      await use(await config)
    },
    { auto: true, scope: 'file' },
  ],
  restClient: async ({ payload, resetBetweenTests, restClientInstance }, use) => {
    await use(resetBetweenTests ? new NextRESTClient(payload.config) : restClientInstance)
  },
  restClientInstance: [
    async ({ payloadInstance }, use) => {
      await use(new NextRESTClient(payloadInstance.config))
    },
    { scope: 'file' },
  ],
  sdk: async ({ payload }, use) => {
    await use(getSDK(payload.config))
  },
  seedAtStart: [
    // Overridden by test.suite only when a suite disables resets between tests.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use(undefined)
    },
    { auto: true, scope: 'file' },
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
})

/**
 * Integration test API with Payload's shared lifecycle and database filtering.
 *
 * Payload-backed test files supply their config to one root `test.suite`. The config module is
 * imported once before file hooks run. Payload is initialized lazily, once per file, and destroyed
 * afterward. Before every test that uses Payload, REST, or the SDK, the database and upload
 * directories are reset and the suite's optional seed function is run. REST and SDK clients are
 * recreated per test. Suites that already manage their own isolation can set `resetBetweenTests` to
 * false to reset and seed once, then share their database state and REST client. Standalone
 * integration tests use `test.suite({})` and do not initialize Payload.
 *
 * @example
 * test.suite({ config: './config.ts' })('Posts', () => {
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
  suite(
    this: typeof testWithFixtures,
    { config, cron = true, db, resetBetweenTests = true }: TestSuiteOptions,
  ) {
    this.override('configPath', config ? path.resolve(getTestDirectory(), config) : null)
    this.override('resetBetweenTests', resetBetweenTests)
    this.override('testCron', cron)

    if (!resetBetweenTests) {
      this.override('seedAtStart', async ({ payloadInstance: payload }) => {
        const testDataConfig = getTestDataConfig(payload.config)

        if (!testDataConfig) {
          throw new Error('Test suite metadata was not registered by buildConfigWithDefaults.')
        }

        // This state is used for the whole file, so there is no later reset to restore it into.
        // Skip creating a snapshot that would never be read.
        await resetAndSeed({ alwaysSeed: true, payload, ...testDataConfig })
      })
    }

    return this.describe.runIf(matchesDatabase({ db }))
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
