import path from 'path'

const [testConfigDir] = process.argv.slice(2)

import type { SanitizedConfig } from 'payload'

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

    process.env.ROOT_DIR =
      testConfigDir === 'live-preview' || testConfigDir === 'admin-root'
        ? testDir
        : path.resolve(dirname, '..')

    await generateImportMap(config, { log: true, force: true })
  }
}

await run()
