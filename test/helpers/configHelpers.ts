import swcRegister from '@swc/register'
import express from 'express'
import getPort from 'get-port'
import path from 'path'
import shelljs from 'shelljs'

import type { Payload } from '../../packages/payload/src'
import type { InitOptions } from '../../packages/payload/src/config/types'

import payload from '../../packages/payload/src'

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
  const config = (await import(process.env.PAYLOAD_CONFIG_PATH)).default

  const initOptions: InitOptions = {
    local: true,
    config,
    ...(options.init || {}),
  }

  process.env.PAYLOAD_DROP_DATABASE = 'true'
  process.env.NODE_ENV = 'test'

  if (!initOptions?.local) {
    initOptions.express = express()
  }

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

  await payload.init(initOptions)

  const port = await getPort()
  if (initOptions.express) {
    initOptions.express.listen(port)
  }

  return { serverURL: `http://localhost:${port}`, payload }
}
