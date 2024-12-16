import fs from 'fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { generateImportMap, type SanitizedConfig } from 'payload'

import type { allDatabaseAdapters } from './generateDatabaseAdapter.js'

import { generateDatabaseAdapter } from './generateDatabaseAdapter.js'
import { getNextRootDir } from './helpers/getNextRootDir.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const runImmediately = process.argv[2] === 'true'

export async function initDevAndTest({
  testSuite,
  writeDBAdapter,
  skipGenImportMap,
}: {
  skipGenImportMap?: boolean
  testSuite: string
  writeDBAdapter: boolean
}): Promise<void> {
  const importMapPath: string = path.resolve(
    getNextRootDir(testSuite).rootDir,
    './app/(payload)/admin/importMap.js',
  )

  try {
    fs.writeFileSync(importMapPath, 'export const importMap = {}')
  } catch (error) {
    console.log('Error writing importMap.js', error)
  }

  if (writeDBAdapter) {
    const dbAdapter: keyof typeof allDatabaseAdapters =
      (process.env.PAYLOAD_DATABASE as keyof typeof allDatabaseAdapters) || 'mongodb'
    generateDatabaseAdapter(dbAdapter)
  }

  if (skipGenImportMap) {
    console.log('Done')
    return
  }

  // Generate importMap
  const testDir = path.resolve(dirname, testSuite)
  console.log('Generating import map for config:', testDir)

  const configUrl = pathToFileURL(path.resolve(testDir, 'config.ts')).href
  const config: SanitizedConfig = await (await import(configUrl)).default

  process.env.ROOT_DIR = getNextRootDir(testSuite).rootDir

  await generateImportMap(config, { log: true, force: true })

  console.log('Done')
}

if (runImmediately) {
  const testSuite = process.argv[3]
  const writeDBAdapter = process.argv[4] === 'true'
  const skipGenImportMap = process.argv[5] === 'true'

  void initDevAndTest({ testSuite, writeDBAdapter, skipGenImportMap })
}
