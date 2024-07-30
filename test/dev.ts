import chalk from 'chalk'
import minimist from 'minimist'
import { nextDev } from 'next/dist/cli/next-dev.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import open from 'open'
import { generateImportMap } from 'payload'

import { getNextJSRootDir } from './helpers/getNextJSRootDir.js'
import { load } from './loader/load.js'
import { createTestHooks } from './testHooks.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

process.env.PAYLOAD_DROP_DATABASE = 'true'

const {
  _: [testSuiteArg],
  ...args
} = minimist(process.argv.slice(2))

if (!fs.existsSync(path.resolve(dirname, testSuiteArg))) {
  console.log(chalk.red(`ERROR: The test folder "${testSuiteArg}" does not exist`))
  process.exit(0)
}

if (args.turbo === true) {
  process.env.TURBOPACK = '1'
}

process.env.PAYLOAD_DROP_DATABASE = 'true'

const { beforeTest } = await createTestHooks(testSuiteArg)
await beforeTest()

const { rootDir, adminRoute } = getNextJSRootDir(testSuiteArg)

/*
Gen importMap
 */
const testDir = path.resolve(dirname, testSuiteArg)

const pathWithConfig = path.resolve(testDir, 'config.ts')
console.log('Generating import map for config:', pathWithConfig)

const config = await load(pathWithConfig)

process.env.NEXT_PUBLIC_ROOT_DIR = path.resolve(dirname, '..')

await generateImportMap(config, { log: true, force: true })
/*
Gen importMap end
 */

// Open the admin if the -o flag is passed
if (args.o) {
  await open(`http://localhost:3000${adminRoute}`)
}

// @ts-expect-error
await nextDev({ port: process.env.PORT || 3000, dirname: rootDir }, 'default', rootDir)

// fetch the admin url to force a render
void fetch(`http://localhost:${process.env.PORT || 3000}${adminRoute}`)
