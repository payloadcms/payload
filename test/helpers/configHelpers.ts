import getPort from 'get-port'
import { nextDev } from 'next/dist/cli/next-dev.js'
import path from 'path'

import type { SanitizedConfig } from '../../packages/payload/src/config/types.js'
import type { Payload } from '../../packages/payload/src/index.js'

import { getPayload } from '../../packages/payload/src/index.js'
import wait from '../../packages/payload/src/utilities/wait.js'

type Args = {
  config: Promise<SanitizedConfig>
  dirname: string
}

type Result = {
  payload: Payload
  serverURL: string
}

export async function initPayloadE2E({ config, dirname }: Args): Promise<Result> {
  const port = await getPort()
  const serverURL = `http://localhost:${port}`
  process.env.NODE_OPTIONS = '--no-deprecation'
  process.env.PAYLOAD_CONFIG_PATH = path.resolve(dirname, './config.js')
  process.env.PAYLOAD_DROP_DATABASE = 'true'
  process.env.PORT = String(port)

  const payload = await getPayload({ config })

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
  return { payload, serverURL }
}
