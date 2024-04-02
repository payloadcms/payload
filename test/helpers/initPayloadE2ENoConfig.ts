import { createServer } from 'http'
import nextImport from 'next'
import path from 'path'
import { wait } from 'payload/utilities'
import { parse } from 'url'

import type { GeneratedTypes } from './sdk/types.js'

import { createTestHooks } from '../testHooks.js'
import { PayloadTestSDK } from './sdk/index.js'

type Args = {
  dirname: string
}

type Result<T extends GeneratedTypes<T>> = {
  payload: PayloadTestSDK<T>
  serverURL: string
}

export async function initPayloadE2ENoConfig<T extends GeneratedTypes<T>>({
  dirname,
}: Args): Promise<Result<T>> {
  // @ts-expect-error
  process.env.NODE_ENV = 'test'
  process.env.NODE_OPTIONS = '--no-deprecation'
  process.env.PAYLOAD_DROP_DATABASE = 'true'

  const testSuiteName = dirname.split('/').pop()
  const { beforeTest } = await createTestHooks(testSuiteName)
  await beforeTest()

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

  return {
    serverURL,
    payload: new PayloadTestSDK<T>({ serverURL }),
  }
}
