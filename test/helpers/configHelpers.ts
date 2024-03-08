import getPort from 'get-port'
//import { nextDev } from 'next/dist/cli/next-dev.js'
import path from 'path'

import type { SanitizedConfig } from '../../packages/payload/src/config/types.js'
import type { Payload } from '../../packages/payload/src/index.js'

import { getPayload } from '../../packages/payload/src/index.js'
import { bootAdminPanel } from './bootAdminPanel.mjs'

type InitializedPayload = { payload: Payload; serverURL: string }

export async function initPayloadE2E(args: {
  config: Promise<SanitizedConfig>
  dirname: string
}): Promise<InitializedPayload> {
  const { config, dirname } = args

  console.log('dirname', dirname)

  // process.env.TURBOPACK = '1' // Not working due to turbopack pulling in mongoose, pg
  process.env.PAYLOAD_CONFIG_PATH = path.resolve(dirname, './config.js')
  process.env.PAYLOAD_DROP_DATABASE = 'true'
  //process.env.NODE_ENV = 'test'

  const payload = await getPayload({ config })

  const port = await getPort()
  const serverURL = `http://localhost:${port}`

  //process.env.APP_ENV = 'test'
  //process.env.__NEXT_TEST_MODE = 'jest'

  //await nextDev({ _: [path.resolve(dirname, '../../')], port }) // Running nextDev directly does not work for ports other than 3000
  await bootAdminPanel({ port, appDir: path.resolve(dirname, '../../') })
  return { serverURL, payload }
}
