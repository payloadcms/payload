import type { PayloadTypesShape } from 'payload'

import { PayloadSDK } from '@payloadcms/sdk'
import { spawn } from 'node:child_process'
import path, { dirname, resolve } from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'

import { getNextRootDir } from './getNextRootDir.js'
import { PayloadTestSDK } from './sdk/index.js'

const _filename = fileURLToPath(import.meta.url)
const _dirname = dirname(_filename)

type Args = {
  dirname: string
  prebuild?: boolean
}

type Result<T extends PayloadTypesShape> = {
  payload: PayloadTestSDK<T>
  /**
   * REST API client for the running server. It sends no token, so requests are authenticated by the
   * config's `admin.autoLogin` user (the dev user unless a suite disables it). That keeps it valid
   * across `reInitializeDB`, which recreates the user.
   */
  sdk: PayloadSDK<T>
  serverURL: string
}

export async function initPayloadE2ENoConfig<T extends PayloadTypesShape>({
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
    sdk: new PayloadSDK<T>({ baseURL: formatAdminURL({ apiRoute: '/api', serverURL }) }),
  }
}
