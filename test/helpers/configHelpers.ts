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

  //process.env.NODE_ENV = 'test'
  //process.env.APP_ENV = 'test'
  //process.env.__NEXT_TEST_MODE = 'jest'

  nextDev({
    _: [path.resolve(dirname, '../../')],
    '--port': port,
    // '--turbo': '1',
  })

  await wait(3000)
  return { serverURL }
}
