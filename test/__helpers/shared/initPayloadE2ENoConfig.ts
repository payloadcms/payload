import { spawn } from 'node:child_process'
import path, { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import type { GeneratedTypes } from './sdk/types.js'

import { getNextRootDir } from './getNextRootDir.js'
import { PayloadTestSDK } from './sdk/index.js'

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

  // Default to 3000 if PORT is not set, but allow it to be overridden by the environment variable
  const defaultPort = 3000

  const port = process.env.PORT ? Number(process.env.PORT) : defaultPort
  process.env.PORT = String(port)
  process.env.PAYLOAD_CI_DEPENDENCY_CHECKER = 'true'

  const serverURL = `http://localhost:${port}`

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
        if (code === 0) {
          res()
        }
        rej(new Error('closed with code ' + code))
      })
    })
  }

  process.env.NODE_OPTIONS = '--max-old-space-size=8192 --no-deprecation'

  return {
    serverURL,
    payload: new PayloadTestSDK<T>({ serverURL }),
  }
}
