import { promises as _promises } from 'fs'
import { createServer } from 'http'
import nextImport from 'next'
import { parse } from 'url'

import type { SanitizedConfig } from '../../packages/payload/src/config/types.js'
import type { Payload } from '../../packages/payload/src/index.js'

import { getPayloadHMR } from '../../packages/next/src/utilities/getPayloadHMR.js'
import wait from '../../packages/payload/src/utilities/wait.js'
import { beforeTest } from '../beforeTest.js'

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
  await beforeTest(testSuiteName)

  process.env.NODE_OPTIONS = '--no-deprecation'
  process.env.PAYLOAD_DROP_DATABASE = 'true'

  // @ts-expect-error
  process.env.NODE_ENV = 'test'
  const payload = await getPayloadHMR({ config })

  // const port = await getPort()
  const port = 3000
  process.env.PORT = String(port)
  const serverURL = `http://localhost:${port}`

  // @ts-expect-error
  const app = nextImport({ dev: true, hostname: 'localhost', port })
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

  await wait(3000)

  return { payload, serverURL }
}
