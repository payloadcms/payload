import type { Payload, SanitizedConfig } from 'payload'
import type { SuiteCollector, SuiteFactory } from 'vitest'

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
} & TestOptions

type IntegrationFixtures = {
  $file: {
    config: SanitizedConfig
    configPath: null | string
    /** Raw file-scoped instance for suite hooks. Tests should use `payload`. */
    payloadInstance: Payload
    /** Config supplied to `suite`, imported automatically before file hooks run. */
    resolvedConfig: null | SanitizedConfig
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

type IntegrationFixtureContext = IntegrationFixtures['$file'] & IntegrationFixtures['$test']

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
          "This integration test requires Payload. Pass its config path to suite('Name', { config: './config.ts' }, ...).",
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
          "This integration test requires Payload. Pass its config path to suite('Name', { config: './config.ts' }, ...).",
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
  payload: async ({ payloadInstance }, use) => {
    const testDataConfig = getTestDataConfig(payloadInstance.config)

    if (!testDataConfig) {
      throw new Error('Test suite metadata was not registered by buildConfigWithDefaults.')
    }

    await resetAndSeed({ payload: payloadInstance, ...testDataConfig })
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
  sdk: async ({ payload }, use) => {
    await use(getSDK(payload.config))
  },
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
 * Payload-backed test files supply their config to one root `suite`. The config module is
 * imported once before file hooks run. Payload is initialized lazily, once per file, and destroyed
 * afterward. Before every test that uses Payload, REST, or the SDK, the database and upload
 * directories are reset and the suite's optional seed function is run. REST and SDK clients are
 * recreated per test. Standalone integration tests use `suite('Name', {}, ...)` and do not initialize
 * Payload.
 *
 * @example
 * suite('Posts', { config: './config.ts' }, () => {
 *   test('reads posts', async ({ payload }) => {
 *     await payload.find({ collection: 'posts' })
 *   })
 * })
 */
export const test = testWithFixtures

export const it = test

// Standalone suite and hook functions keep Vitest's static test discovery aligned with runtime.
// File hooks use their `this` value to resolve file-scoped fixtures, so retain the fixture API as
// their receiver when exposing them as standalone functions.
export const afterAll = testWithFixtures.afterAll.bind(testWithFixtures)
export const afterEach = testWithFixtures.afterEach
export const aroundAll = testWithFixtures.aroundAll.bind(testWithFixtures)
export const aroundEach = testWithFixtures.aroundEach
export const beforeAll = testWithFixtures.beforeAll.bind(testWithFixtures)
export const beforeEach = testWithFixtures.beforeEach
export const describe = testWithFixtures.describe

export const suite = (
  name: string,
  { config, cron = true, db }: TestSuiteOptions,
  factory: SuiteFactory<IntegrationFixtureContext>,
): SuiteCollector<IntegrationFixtureContext> => {
  testWithFixtures.override('configPath', config ? path.resolve(getTestDirectory(), config) : null)
  testWithFixtures.override('testCron', cron)

  return testWithFixtures.describe.runIf(matchesDatabase({ db }))(name, factory)
}

const getTestDirectory = (): string => {
  const testPath = expect.getState().testPath

  if (!testPath) {
    throw new Error('Could not determine the integration test file path.')
  }

  return path.dirname(testPath)
}

const isMongo = mongooseList.includes(process.env.PAYLOAD_DATABASE!)

export const matchesDatabase = ({ db = 'all' }: TestOptions = {}): boolean => {
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
