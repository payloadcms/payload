import { generateSchema } from '@payloadcms/graphql/utilities'
import fs from 'fs'
import path from 'path'

import { setTestEnvPaths } from './helpers/setTestEnvPaths.js'

const [testConfigDir] = process.argv.slice(2)
import { fileURLToPath } from 'url'

import { load } from './loader/load.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const loadConfig = async (configPath: string) => {
  const configPromise = await load(configPath)
  return configPromise
}

let testDir
if (testConfigDir) {
  testDir = path.resolve(dirname, testConfigDir)
  const config = await loadConfig(path.resolve(testDir, 'config.ts'))

  setTestEnvPaths(testDir)
  generateSchema(config)
} else {
  // Generate graphql schema for entire directory
  testDir = dirname

  const config = await loadConfig(path.resolve(testDir, 'config.ts'))

  fs.readdirSync(dirname, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .forEach((dir) => {
      const suiteDir = path.resolve(testDir, dir.name)
      const configFound = setTestEnvPaths(suiteDir)
      if (configFound) generateSchema(config)
    })
}
