// Runs the real Payload CLI against a test suite config:
//   pnpm payload <test-suite> <command> [...args]
// The first positional arg selects `test/<test-suite>/config.ts`; everything after it is
// forwarded to the CLI untouched, so every `payload` command works as it does in a user project.
import chalk from 'chalk'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { bin } from 'payload/cli'

import { getNextRootDir } from './__helpers/shared/getNextRootDir.js'
import { setTestEnvPaths } from './__helpers/shared/setTestEnvPaths.js'
import { generateDatabaseAdapter, getCurrentDatabaseAdapter } from './dbAdapters.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const [testSuiteArg, ...cliArgs] = process.argv.slice(2)

if (!testSuiteArg || testSuiteArg.startsWith('-')) {
  console.log(
    chalk.red(
      'ERROR: The test suite folder must be the first argument, e.g. `pnpm payload fields generate:types`',
    ),
  )
  process.exit(1)
}

const testDir = path.resolve(dirname, testSuiteArg)

if (!setTestEnvPaths(testDir)) {
  console.log(chalk.red(`ERROR: No config.ts found in the test folder "${testSuiteArg}"`))
  process.exit(1)
}

if (process.env.WRITE_DB_ADAPTER !== 'false') {
  generateDatabaseAdapter(getCurrentDatabaseAdapter())
  process.env.WRITE_DB_ADAPTER = 'false'
}

// generateImportMap discovers the admin app relative to ROOT_DIR
process.env.ROOT_DIR = getNextRootDir(testSuiteArg).rootDir

console.log(chalk.dim(`Selected test suite: ${testSuiteArg}`))

// Hide the test suite arg from commander so the CLI only parses its own args
process.argv = [process.argv[0]!, process.argv[1]!, ...cliArgs]

await bin()
