import fs from 'fs'
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'path'
import { generateTypes } from 'payload/node'

import { setTestEnvPaths } from './__helpers/shared/setTestEnvPaths.js'

const [testConfigDir] = process.argv.slice(2)

import type { SanitizedConfig } from 'payload'

import { fileURLToPath } from 'url'

import { generateDatabaseAdapter } from './dbAdapters.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let testDir: string

const writeDBAdapter = process.env.WRITE_DB_ADAPTER !== 'false'
async function run() {
  if (writeDBAdapter) {
    generateDatabaseAdapter(process.env.PAYLOAD_DATABASE || 'mongodb')
    process.env.WRITE_DB_ADAPTER = 'false'
  }

  if (testConfigDir) {
    testDir = path.resolve(dirname, testConfigDir)

    const pathWithConfig = path.resolve(testDir, 'config.ts')
    console.log('Generating types for config:', pathWithConfig)

    const config: SanitizedConfig = await (await import(pathWithConfig)).default

    setTestEnvPaths(testDir)
    await generateTypes(config)

    // Generation is done; Configs that leave handles open (e.g. storage-r2's undisposed
    // Cloudflare workerd runtime) shouldn't keep the process alive.
    process.exit(0)
  } else {
    // Search through every folder in dirname, and if it has a config.ts file, generate types for it
    const foundDirs: string[] = []

    fs.readdirSync(dirname, { withFileTypes: true })
      .filter((f) => f.isDirectory())
      .forEach((dir) => {
        const suiteDir = path.resolve(dirname, dir.name)
        const configFound = fs.existsSync(path.resolve(suiteDir, 'config.ts'))
        if (configFound) {
          foundDirs.push(dir.name)
        }
      })

    const failedDirs: string[] = []
    let nextIndex = 0

    // Each config runs in a new node process that runs test/generateTypes with the suite as argument. Can't run it in this
    // process, as there could otherwise be breakage between tests, as node can cache things in between runs.
    // Every process loads a full config, so only run as many at once as there are CPUs.
    const generateNext = async (): Promise<void> => {
      while (nextIndex < foundDirs.length) {
        const suiteDir = foundDirs[nextIndex++]!

        console.log(`Generating types for config ${nextIndex} / ${foundDirs.length}:`, suiteDir)

        const code = await new Promise<null | number>((resolve) => {
          const child = spawn('node', [
            '--no-deprecation',
            '--import',
            '@swc-node/register/esm-register',
            'test/generateTypes.ts',
            suiteDir,
          ])

          child.stdout.setEncoding('utf8')
          child.stdout.on('data', function (data) {
            console.log(suiteDir + ' stdout: ' + data)
          })

          child.stderr.setEncoding('utf8')
          child.stderr.on('data', function (data) {
            console.log(suiteDir + ' stderr: ' + data)
          })

          child.on('close', resolve)
        })

        console.log(suiteDir + ' closing code: ' + code)

        if (code !== 0) {
          failedDirs.push(suiteDir)
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(os.availableParallelism(), foundDirs.length) }, generateNext),
    )

    if (failedDirs.length > 0) {
      console.error(`Failed to generate types for: ${failedDirs.join(', ')}`)
      process.exit(1)
    }
  }
}

void run()
