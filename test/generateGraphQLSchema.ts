import type { SanitizedConfig } from 'payload'

import { generateSchema } from '@payloadcms/graphql/utilities'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { setTestEnvPaths } from './helpers/setTestEnvPaths.js'

const [testConfigDir] = process.argv.slice(2)

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const loadConfig = async (configPath: string): Promise<SanitizedConfig> => {
  return await (
    await import(configPath)
  ).default
}

let testDir: string
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
