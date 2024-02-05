import swcRegister from '@swc/register'
import getPort from 'get-port'
import path from 'path'
import shelljs from 'shelljs'

import type { Payload } from '../../packages/payload/src'
import type { InitOptions } from '../../packages/payload/src/config/types'

import { getPayload } from '../../packages/payload/src'
import { bootAdminPanel } from './bootAdminPanel'

type Options = {
  __dirname: string
  init?: Partial<InitOptions>
}

type InitializedPayload = { payload: Payload; serverURL: string }

export async function initPayloadE2E(__dirname: string): Promise<InitializedPayload> {
  const webpackCachePath = path.resolve(__dirname, '../../node_modules/.cache/webpack')
  shelljs.rm('-rf', webpackCachePath)
  return initPayloadTest({
    __dirname,
    init: {
      local: false,
    },
  })
}

export async function initPayloadTest(options: Options): Promise<InitializedPayload> {
  process.env.PAYLOAD_CONFIG_PATH = path.resolve(options.__dirname, './config.ts')

  const initOptions: InitOptions = {
    local: true,
    config: require(process.env.PAYLOAD_CONFIG_PATH).default,
    ...(options.init || {}),
  }

  process.env.PAYLOAD_DROP_DATABASE = 'true'
  process.env.NODE_ENV = 'test'

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - bad @swc/register types
  swcRegister({
    sourceMaps: 'inline',
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
      },
    },
    module: {
      type: 'commonjs',
    },
  })

  const payload = await getPayload(initOptions)

  const port = await getPort()
  const serverURL = `http://localhost:${port}`

  if (!initOptions?.local) {
    process.env.APP_ENV = 'test'
    process.env.__NEXT_TEST_MODE = 'jest'
    await bootAdminPanel({ port, appDir: path.resolve(__dirname, '../../packages/dev') })
  }

  return { serverURL, payload }
}
