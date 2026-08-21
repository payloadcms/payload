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

const testWithDirectory = vitestTest.extend('testDir', { scope: 'file' }, () => getTestDirectory())

const testWithConfig = testWithDirectory.extend(
  'config',
  { scope: 'file' },
  async ({ testDir }) => {
    const { config } = await initPayloadInt(testDir, undefined, false)

    return config
  },
)

const testWithPayload = testWithConfig.extend(
  'payload',
  { scope: 'file' },
  async ({ config }, { onCleanup }) => {
    const payload = await getPayload({ config, cron: true })

    onCleanup(() => payload.destroy())

    return payload
  },
)

const testWithRestClient = testWithPayload.extend('restClient', ({ payload }) => {
  return new NextRESTClient(payload.config)
})

const testWithSDK = testWithRestClient.extend('sdk', ({ payload }) => {
  return getSDK(payload.config)
})

const testWithFixtures = testWithSDK.extend('cli', ({ testDir }) => {
  return async (input: Parameters<typeof runCLICommand>[0]) => {
    const configPath = typeof input === 'string' ? undefined : input.configPath

    await initPayloadInt(testDir, undefined, false, configPath)

    return runCLICommand(input, { cwd: testDir })
  }
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
