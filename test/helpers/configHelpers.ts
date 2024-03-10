import { spawn } from 'child_process'
import getPort from 'get-port'
import { nextDev } from 'next/dist/cli/next-dev.js'
import path from 'path'

import wait from '../../packages/payload/src/utilities/wait.js'

type Args = {
  dirname: string
}

type Result = {
  serverURL: string
}

export async function initPayloadE2E({ dirname }: Args): Promise<Result> {
  const port = await getPort()
  const serverURL = `http://localhost:${port}`
  process.env.PAYLOAD_CONFIG_PATH = path.resolve(dirname, './config.js')
  process.env.PAYLOAD_DROP_DATABASE = 'true'
  process.env.PORT = String(port)

  // @ts-expect-error
  process.env.NODE_ENV = 'test'

  nextDev({
    _: [path.resolve(dirname, '../../')],
    '--port': port,
    // Turbo doesn't seem to be reading
    // our tsconfig paths, commented out for now
    // '--turbo': '1',
  })

  await wait(3000)
  return { serverURL }
}

export async function initPayloadSpawn({ dirname }: Args): Promise<Result> {
  const port = await getPort()
  const serverURL = `http://localhost:${port}`

  // Tried using a child process to get
  // turbopack to pick up our tsconfig aliases
  // but this didn't make a difference.
  // Keeping it here so we can continue to try.
  spawn('pnpm', ['dev', '--turbo'], {
    cwd: path.resolve(dirname, '../../'),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      PAYLOAD_CONFIG_PATH: path.resolve(dirname, '../../config.js'),
      PAYLOAD_DROP_DATABASE: 'true',
    },
  })

  await wait(3000)

  return { serverURL }
}
