import nextEnvImport from '@next/env'
import { createServer } from 'http'
import nextImport from 'next'
import { parse } from 'url'

import { getNextRootDir } from '../__helpers/shared/getNextRootDir.js'

export type DevServerResult = {
  adminRoute: string
  port: number
  rootDir: string
}

export async function startNextDevServer({
  enableTurbo,
  port,
  testSuiteArg,
}: {
  enableTurbo: boolean
  port: number
  testSuiteArg: string
}): Promise<DevServerResult> {
  const { adminRoute, rootDir } = getNextRootDir(testSuiteArg)

  nextEnvImport.updateInitialEnv(process.env)

  // @ts-expect-error the same as in test/__helpers/initPayloadE2E.ts
  const app = nextImport({
    dev: true,
    dir: rootDir,
    hostname: 'localhost',
    port,
    turbopack: enableTurbo,
  })

  const handle = app.getRequestHandler()

  await new Promise<void>((resolve) => {
    void app.prepare().then(() => {
      createServer(async (req, res) => {
        const parsedUrl = parse(req.url || '', true)
        await handle(req, res, parsedUrl)
      }).listen(port, () => {
        resolve()
      })
    })
  })

  return { adminRoute, port, rootDir }
}
