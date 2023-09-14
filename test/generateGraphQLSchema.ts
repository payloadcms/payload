import fs from 'fs'
import path from 'path'

import { generateGraphQLSchema } from '../packages/payload/src/bin/generateGraphQLSchema'

const [testConfigDir] = process.argv.slice(2)

let testDir
if (testConfigDir) {
  testDir = path.resolve(__dirname, testConfigDir)
  setPaths(testDir)
  generateGraphQLSchema()
} else {
  // Generate graphql schema for entire directory
  testDir = __dirname

  fs.readdirSync(__dirname, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .forEach((dir) => {
      const suiteDir = path.resolve(testDir, dir.name)
      const configFound = setPaths(suiteDir)
      if (configFound) generateGraphQLSchema()
    })
}

// Set config path and TS output path using test dir
function setPaths(dir) {
  const configPath = path.resolve(dir, 'config.ts')
  if (fs.existsSync(configPath)) {
    process.env.PAYLOAD_CONFIG_PATH = configPath
    return true
  }
  return false
}
