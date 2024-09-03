import { createServer } from 'http'
import nextImport from 'next'
import { spawn } from 'node:child_process'
import path, { dirname, resolve } from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath, parse } from 'url'

import type { GeneratedTypes } from './sdk/types.js'

import { runInitSeparateProcess } from '../runInitSeparateProcess.js'
import { createTestHooks } from '../testHooks.js'
import { getNextRootDir } from './getNextRootDir.js'
import { PayloadTestSDK } from './sdk/index.js'
import startMemoryDB from './startMemoryDB.js'

const _filename = fileURLToPath(import.meta.url)
const _dirname = dirname(_filename)

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
  const testSuiteName = path.basename(dirname)

  await runInitSeparateProcess(testSuiteName, true)

  const { beforeTest } = await createTestHooks(testSuiteName)
  await beforeTest()

  const port = 3000
  process.env.PORT = String(port)
  process.env.PAYLOAD_CI_DEPENDENCY_CHECKER = 'true'

  const serverURL = `http://localhost:${port}`

  await startMemoryDB()

  const { rootDir } = getNextRootDir(testSuiteName)

  if (prebuild) {
    await new Promise<void>((res, rej) => {
      const buildArgs = ['--max-old-space-size=8192', resolve(_dirname, 'build.js')]

      const childProcess = spawn('node', buildArgs, {
        stdio: 'inherit',
        env: {
          PATH: process.env.PATH,
          NODE_ENV: 'production',
          NEXTJS_DIR: rootDir,
        },
      })

      childProcess.on('close', (code) => {
        if (code === 0) res()
        rej()
      })
    })
  }

  process.env.NODE_OPTIONS = '--max-old-space-size=8192 --no-deprecation'

  // @ts-expect-error
  const app = nextImport({
    dev: !prebuild,
    hostname: 'localhost',
    port,
    dir: rootDir,
  })

  const handle = app.getRequestHandler()

  let resolveServer

  const serverPromise = new Promise((res) => (resolveServer = res))

  // Need a custom server because calling nextDev straight
  // starts up a child process, and payload.onInit() is called twice
  // which seeds test data twice + other bad things.
  // We initialize Payload above so we can have access to it in the tests
  void app.prepare().then(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
