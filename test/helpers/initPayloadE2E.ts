import type { SanitizedConfig } from 'payload/config'

import { getPayloadHMR } from '@payloadcms/next/utilities'
import { createServer } from 'http'
import nextImport from 'next'
import path from 'path'
import { type Payload } from 'payload'
import { wait } from 'payload/utilities'
import { parse } from 'url'

import { startMemoryDB } from '../startMemoryDB.js'
import { createTestHooks } from '../testHooks.js'

type Args = {
  config: Promise<SanitizedConfig>
  dirname: string
}

type Result = {
  payload: Payload
  serverURL: string
}

export async function initPayloadE2E({ config, dirname }: Args): Promise<Result> {
  const testSuiteName = dirname.split('/').pop()
  const { beforeTest } = await createTestHooks(testSuiteName)
  await beforeTest()

  process.env.NODE_OPTIONS = '--no-deprecation'
  process.env.PAYLOAD_DROP_DATABASE = 'true'

  // @ts-expect-error
  process.env.NODE_ENV = 'test'

  const configWithMemoryDB = await startMemoryDB(config)
  const payload = await getPayloadHMR({ config: configWithMemoryDB })

  const port = 3000
  process.env.PORT = String(port)
  const serverURL = `http://localhost:${port}`

  // @ts-expect-error
  const app = nextImport({
    dev: true,
    hostname: 'localhost',
    port,
    dir: path.resolve(dirname, '../../'),
  })

  const handle = app.getRequestHandler()

  let resolveServer

  const serverPromise = new Promise((res) => (resolveServer = res))

  // Need a custom server because calling nextDev straight
  // starts up a child process, and payload.onInit() is called twice
  // which seeds test data twice + other bad things.
  // We initialize Payload above so we can have access to it in the tests
  void app.prepare().then(() => {
    createServer(async (req, res) => {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    }).listen(port, () => {
      resolveServer()
    })
  })

  await serverPromise

  await wait(port)

  return { payload, serverURL }
}
