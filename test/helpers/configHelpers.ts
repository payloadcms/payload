import getPort from 'get-port'
import json5 from 'json5'
import { nextDev } from 'next/dist/cli/next-dev.js'
import path, { resolve } from 'path'
const { parse } = json5
import { promises as _promises, promises } from 'fs'
const { readFile } = promises
const { writeFile } = _promises

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
  const configPath = path.resolve(dirname, './config.js')
  process.env.PAYLOAD_CONFIG_PATH = configPath
  process.env.PAYLOAD_DROP_DATABASE = 'true'
  process.env.PORT = String(port)

  const testSuite = configPath.split('/test/')[1].split('/')[0]

  // Set path.'payload-config' in tsconfig.json
  const tsConfigPath = resolve(process.cwd(), 'tsconfig.json')
  const tsConfig = await parse(await readFile(tsConfigPath, 'utf8'))
  tsConfig.compilerOptions.paths['@payload-config'] = [`./test/${testSuite}/config.ts`]

  await writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2))

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
