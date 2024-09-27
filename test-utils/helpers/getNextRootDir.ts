import fs from 'fs'
import path, { resolve } from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * The root directory for e2e tests is either the monorepo root (normal e2e) or the test directory (test e2e).
 */
export function getNextRootDir(testSuite?: string) {
  let adminRoute = '/admin'

  /*
   * Handle test suites that have their own app directory
   */
  if (testSuite) {
    const testSuiteDir = resolve(dirname, `../../test/${testSuite}`)

    console.log('testSuiteDir', testSuiteDir)

    let hasNextConfig = false

    try {
      fs.accessSync(`${testSuiteDir}/next.config.mjs`, fs.constants.F_OK)
      hasNextConfig = true
    } catch (err) {
      // Swallow err - no config found
    }

    if (testSuite === 'admin-root') {
      adminRoute = '/'
    }

    if (hasNextConfig) {
      return {
        rootDir: testSuiteDir,
        adminRoute,
      }
    }
  }

  /*
   * Handle normal cases
   */
  if (process.env.PAYLOAD_TEST_PROD === 'true') {
    return {
      rootDir: path.resolve(dirname, '..'),
      adminRoute,
    }
  }

  return {
    rootDir: path.resolve(dirname, '..', '..'),
    adminRoute,
  }
}
