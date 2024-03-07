import getPort from 'get-port'
import { nextDev } from 'next/dist/cli/next-dev.js'
import path from 'path'

import type { SanitizedConfig } from '../../packages/payload/src/config/types.js'
import type { Payload } from '../../packages/payload/src/index.js'

import { getPayload } from '../../packages/payload/src/index.js'

type InitializedPayload = { payload: Payload; serverURL: string }

export async function initPayloadE2E(args: {
  config: Promise<SanitizedConfig>
  dirname: string
}): Promise<InitializedPayload> {
  const { config, dirname } = args

  // process.env.TURBOPACK = '1' // Not working due to turbopack pulling in mongoose, pg
  process.env.PAYLOAD_CONFIG_PATH = path.resolve(dirname, './config.ts')
  process.env.PAYLOAD_DROP_DATABASE = 'true'
  // @ts-expect-error
  process.env.NODE_ENV = 'test'

  const payload = await getPayload({ config })

  const port = await getPort()
  const serverURL = `http://localhost:${port}`

  process.env.APP_ENV = 'test'
  process.env.__NEXT_TEST_MODE = 'jest'
  nextDev({ _: [path.resolve(dirname, '../../')], port: process.env.PORT || 3000 })

  return { serverURL, payload }
}
