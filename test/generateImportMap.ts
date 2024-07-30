import path from 'path'

import { setTestEnvPaths } from './helpers/setTestEnvPaths.js'

const [testConfigDir] = process.argv.slice(2)

import type { SanitizedConfig } from 'payload'

import { generateImportMap } from 'payload'
import { fileURLToPath } from 'url'

import { load } from './loader/load.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let testDir: string

async function run() {
  if (testConfigDir) {
    testDir = path.resolve(dirname, testConfigDir)

    const pathWithConfig = path.resolve(testDir, 'config.ts')
    console.log('Generating import map for config:', pathWithConfig)

    const config: SanitizedConfig = (await load(pathWithConfig)) as unknown as SanitizedConfig

    setTestEnvPaths(testDir)

    process.env.NEXT_PUBLIC_ROOT_DIR = path.resolve(dirname, '..')

    await generateImportMap(config, { log: true, force: true })
  }
}

void run()
