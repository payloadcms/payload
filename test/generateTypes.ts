import fs from 'fs'
import path from 'path'
import { generateTypes } from 'payload/node'

import { setTestEnvPaths } from './helpers/setTestEnvPaths.js'

const [testConfigDir] = process.argv.slice(2)

import type { SanitizedConfig } from 'payload/types'

import { fileURLToPath } from 'url'

import { load } from './loader/load.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let testDir
if (testConfigDir) {
  testDir = path.resolve(dirname, testConfigDir)

  console.log('Generating types for config:', path.resolve(testDir, 'config.ts'))

  const config: SanitizedConfig = (await load(
    path.resolve(testDir, 'config.ts'),
  )) as unknown as SanitizedConfig

  setTestEnvPaths(testDir)
  generateTypes(config)
} else {
  // Generate types for entire directory
  testDir = dirname

  console.log(
    'No testConfigDir passed. Generating types for config:',
    path.resolve(testDir, 'config.ts'),
  )

  const config: SanitizedConfig = (await load(
    path.resolve(testDir, 'config.ts'),
  )) as unknown as SanitizedConfig

  fs.readdirSync(dirname, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .forEach((dir) => {
      const suiteDir = path.resolve(testDir, dir.name)
      const configFound = setTestEnvPaths(suiteDir)
      if (configFound) generateTypes(config)
    })
}
