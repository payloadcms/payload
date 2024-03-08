import fs from 'fs'
import path from 'path'

import { generateTypes } from '../packages/payload/src/bin/generateTypes.js'
import { setTestEnvPaths } from './helpers/setTestEnvPaths.js'

const [testConfigDir] = process.argv.slice(2)

import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let testDir
if (testConfigDir) {
  testDir = path.resolve(dirname, testConfigDir)
  setTestEnvPaths(testDir)
  generateTypes()
} else {
  // Generate types for entire directory
  testDir = dirname

  fs.readdirSync(dirname, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .forEach((dir) => {
      const suiteDir = path.resolve(testDir, dir.name)
      const configFound = setTestEnvPaths(suiteDir)
      if (configFound) generateTypes()
    })
}
