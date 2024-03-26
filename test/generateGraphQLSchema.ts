import fs from 'fs'
import path from 'path'

import { generateGraphQLSchema } from '../packages/payload/src/bin/generateGraphQLSchema'
import { setTestEnvPaths } from './helpers/setTestEnvPaths'

const [testConfigDir] = process.argv.slice(2)

let testDir
if (testConfigDir) {
  testDir = path.resolve(__dirname, testConfigDir)
  setTestEnvPaths(testDir)
  generateGraphQLSchema()
} else {
  // Generate graphql schema for entire directory
  testDir = __dirname

  fs.readdirSync(__dirname, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .forEach((dir) => {
      const suiteDir = path.resolve(testDir, dir.name)
      const configFound = setTestEnvPaths(suiteDir)
      if (configFound) generateGraphQLSchema()
    })
}
