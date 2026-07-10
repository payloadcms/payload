import nextEnvImport from '@next/env'
import { createServer } from 'http'
import nextImport from 'next'
import nextBuild from 'next/dist/build/index.js'
import { parse } from 'url'

import type { DevServerResult } from './nextDevServer.js'

import { getNextRootDir } from '../__helpers/shared/getNextRootDir.js'

export async function startNextProdServer({
  port,
  testSuiteArg,
}: {
  port: number
  testSuiteArg: string
}): Promise<DevServerResult> {
  const { adminRoute, rootDir } = getNextRootDir(testSuiteArg)

  nextEnvImport.updateInitialEnv(process.env)
  ;(process.env as Record<string, string>).NODE_ENV = 'production'

  // Produce a real production build (.next) before booting the server.
  // Mirrors the compile-mode build used by test/__helpers/shared/build.js.
  await nextBuild.default(
    rootDir,
    false,
    false,
    false,
    false,
    false,
    false,
    undefined,
    'compile',
    undefined,
    undefined,
  )

  // @ts-expect-error the same as in test/adapters/nextDevServer.ts
  const app = nextImport({
    dev: false,
    dir: rootDir,
    hostname: 'localhost',
    port,
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
