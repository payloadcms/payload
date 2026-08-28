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

type TestOptions = {
  /** Limits the test or suite to the selected database adapters. */
  db?: 'all' | 'drizzle' | 'mongo' | ((adapterType: DatabaseAdapterType) => boolean)
}

type TestSuiteOptions = {
  config?: Promise<SanitizedConfig> | SanitizedConfig
  cron?: boolean
} & TestOptions

type PayloadState = {
  config?: SanitizedConfig
  payload?: Payload
  resetTestData?: boolean
}

const testWithFixtures = vitestTest
  .extend<'testConfig', Promise<SanitizedConfig> | SanitizedConfig | undefined>(
    'testConfig',
    { scope: 'file' },
    undefined,
  )
  .extend<'testCron', boolean>('testCron', { scope: 'file' }, true)
  .extend<'testSuiteConfigured', boolean>('testSuiteConfigured', { scope: 'file' }, false)
  .extend<'payloadState', PayloadState>(
    'payloadState',
    { scope: 'file' },
    async ({ testConfig, testCron, testSuiteConfigured }, { onCleanup }) => {
      if (testSuiteConfigured && !testConfig) {
        return {}
      }

      const config = testConfig
        ? await testConfig
        : (await initPayloadInt(getTestDirectory(), undefined, false)).config
      const payload = await getPayload({ config, cron: testCron })

      onCleanup(() => payload.destroy())

      return { config, payload, resetTestData: testSuiteConfigured }
    },
  )
  .extend<'config', SanitizedConfig>('config', { scope: 'file' }, ({ payloadState }) => {
    if (!payloadState.config) {
      throw new Error(
        'This integration test requires Payload. Pass its config to test.suite({ config: testConfig })(...).',
      )
    }

    return payloadState.config
  })
  .extend<'payload', Payload>('payload', { scope: 'file' }, ({ payloadState }) => {
    if (!payloadState.payload) {
      throw new Error(
        'This integration test requires Payload. Pass its config to test.suite({ config: testConfig })(...).',
      )
    }

    return payloadState.payload
  })
  .extend<'resetTestData', void>('resetTestData', { auto: true }, async ({ payloadState }) => {
    if (!payloadState.config || !payloadState.payload || !payloadState.resetTestData) {
      return
    }

    const testDataConfig = getTestDataConfig(payloadState.config)

    if (!testDataConfig) {
      throw new Error('Test suite metadata was not registered by buildConfigWithDefaults.')
    }

    await resetAndSeed({ payload: payloadState.payload, ...testDataConfig })
  })
  .extend<'restClient', NextRESTClient>('restClient', ({ payload }) => {
    return new NextRESTClient(payload.config)
  })
  .extend<'sdk', ReturnType<typeof getSDK>>('sdk', ({ payload }) => {
    return getSDK(payload.config)
  })

/**
 * Integration test API with Payload's shared lifecycle and database filtering.
 *
 * Payload-backed test files supply their config to one root `test.suite`. Payload is initialized
 * once for the file and destroyed afterward. Before every test, the database and upload directories
 * are reset, then the suite's optional seed function is run. REST and SDK clients are recreated per
 * test. Standalone integration tests use `test.suite({})` and do not initialize Payload.
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
    testWithFixtures.override('testConfig', config)
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
