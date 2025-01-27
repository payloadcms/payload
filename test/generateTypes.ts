import fs from 'fs'
import path from 'path'

import { generateTypes } from '../packages/payload/src/bin/generateTypes'
import { setTestEnvPaths } from './helpers/setTestEnvPaths'

const [testConfigDir] = process.argv.slice(2)

let testDir
if (testConfigDir) {
  testDir = path.resolve(__dirname, testConfigDir)
  setTestEnvPaths(testDir)
  generateTypes()
} else {
  // Generate types for entire directory
  testDir = __dirname

  fs.readdirSync(__dirname, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .forEach((dir) => {
      const suiteDir = path.resolve(testDir, dir.name)
      const configFound = setTestEnvPaths(suiteDir)
      if (configFound) generateTypes()
    })
}
