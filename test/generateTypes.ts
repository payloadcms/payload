import fs from 'fs'
import { spawn } from 'node:child_process'
import path from 'path'
import { generateTypes } from 'payload/node'

import { setTestEnvPaths } from './helpers/setTestEnvPaths.js'

const [testConfigDir] = process.argv.slice(2)

import type { SanitizedConfig } from 'payload'

import { fileURLToPath } from 'url'

import { generateDatabaseAdapter } from './generateDatabaseAdapter.js'

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

    let i = 0
    for (const suiteDir of foundDirs) {
      i++
      const pathWithConfig = path.resolve(suiteDir, 'config.ts')

      console.log(`Generating types for config ${i} / ${foundDirs.length}:`, pathWithConfig)

      // start a new node process which runs test/generateTypes with pathWithConfig as argument. Can't run it in this process, as there could otherwise be
      // breakage between tests, as node can cache things in between runs.
      // Make sure to wait until the process is done before starting the next one.
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

      child.on('close', function (code) {
        console.log(suiteDir + ' closing code: ' + code)
      })
    }
  }
}

void run()
