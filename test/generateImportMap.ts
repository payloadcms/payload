import path from 'path'

const [testConfigDir] = process.argv.slice(2)

import type { SanitizedConfig } from 'payload'

import fs from 'fs'
import { generateImportMap } from 'payload'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let testDir: string

async function run() {
  if (testConfigDir) {
    testDir = path.resolve(dirname, testConfigDir)

    const pathWithConfig = path.resolve(testDir, 'config.ts')
    console.log('Generating ad-hoc import map for config:', pathWithConfig)

    const config: SanitizedConfig = await (await import(pathWithConfig)).default

    let rootDir = ''

    if (
      testConfigDir === 'live-preview' ||
      testConfigDir === 'admin-root' ||
      testConfigDir === 'admin-bar'
    ) {
      rootDir = testDir

      if (process.env.PAYLOAD_TEST_PROD === 'true') {
        // If in prod mode, there may be a testSuite/prod folder. If so, use that as the rootDir
        const prodDir = path.resolve(testDir, 'prod')
        try {
          fs.accessSync(prodDir, fs.constants.F_OK)
          rootDir = prodDir
        } catch (err) {
          // Swallow err - no prod folder
        }
      }
    } else {
      rootDir = path.resolve(dirname, '..')
    }

    process.env.ROOT_DIR = rootDir
    await generateImportMap(config, { log: true, force: true })
  }
}

await run()
