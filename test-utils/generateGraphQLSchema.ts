import type { SanitizedConfig } from 'payload'

import { generateSchema } from '@payloadcms/graphql/utilities'
import { topLevelTestDir } from 'constants.js'
import fs from 'fs'
import path from 'path'

import { setTestEnvPaths } from './helpers/setTestEnvPaths.js'

const [testConfigDir] = process.argv.slice(2)

const loadConfig = async (configPath: string): Promise<SanitizedConfig> => {
  return await (
    await import(configPath)
  ).default
}

let testDir: string
if (testConfigDir) {
  testDir = path.resolve(topLevelTestDir, testConfigDir)
  const config = await loadConfig(path.resolve(testDir, 'config.ts'))

  setTestEnvPaths(testDir)
  generateSchema(config)
} else {
  // Generate graphql schema for entire directory
  testDir = topLevelTestDir

  const config = await loadConfig(path.resolve(testDir, 'config.ts'))

  fs.readdirSync(topLevelTestDir, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .forEach((dir) => {
      const suiteDir = path.resolve(testDir, dir.name)
      const configFound = setTestEnvPaths(suiteDir)
      if (configFound) {
        generateSchema(config)
      }
    })
}
