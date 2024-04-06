import fs from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const _filename = fileURLToPath(import.meta.url)
const _dirname = dirname(_filename)

export const getNextJSRootDir = (testSuite) => {
  const testSuiteDir = resolve(_dirname, `../${testSuite}`)

  let hasNextConfig = false

  try {
    fs.accessSync(`${testSuiteDir}/next.config.mjs`, fs.constants.F_OK)
    hasNextConfig = true
  } catch (err) {
    // Swallow err - no config found
  }

  if (hasNextConfig) return testSuiteDir

  // If no next config found in test suite,
  // return monorepo root dir
  return resolve(_dirname, '../../')
}
