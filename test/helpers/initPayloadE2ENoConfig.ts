import { createServer } from 'http'
import nextImport from 'next'
import nextBuild from 'next/dist/build/index.js'
import { wait } from 'payload/utilities'
import { parse } from 'url'

import type { GeneratedTypes } from './sdk/types.js'

import { createTestHooks } from '../testHooks.js'
import { getNextJSRootDir } from './getNextJSRootDir.js'
import { PayloadTestSDK } from './sdk/index.js'
import startMemoryDB from './startMemoryDB.js'

type Args = {
  dirname: string
  prebuild?: boolean
}

type Result<T extends GeneratedTypes<T>> = {
  payload: PayloadTestSDK<T>
  serverURL: string
}

export async function initPayloadE2ENoConfig<T extends GeneratedTypes<T>>({
  dirname,
  prebuild,
}: Args): Promise<Result<T>> {
  const testSuiteName = dirname.split('/').pop()
  const { beforeTest } = await createTestHooks(testSuiteName)
  await beforeTest()

  const port = 3000
  process.env.PORT = String(port)
  const serverURL = `http://localhost:${port}`

  await startMemoryDB()

  const dir = getNextJSRootDir(testSuiteName)

  if (prebuild) {
    await nextBuild.default(dir, false, false, false, true, true, false, 'default')
  }

  // @ts-expect-error
  const app = nextImport({
    dev: !prebuild,
    hostname: 'localhost',
    port,
    dir,
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
