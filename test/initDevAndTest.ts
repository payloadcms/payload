import fs from 'fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { generateImportMap, type SanitizedConfig } from 'payload'

import type { DatabaseAdapterType } from './dbAdapters.js'

import { getNextRootDir } from './__helpers/shared/getNextRootDir.js'
import { generateDatabaseAdapter } from './dbAdapters.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const runImmediately = process.argv[2]

export async function initDevAndTest(
  testSuiteArg: string,
  writeDBAdapter: string,
  skipGenImportMap: string,
  configFile?: string,
): Promise<void> {
  const framework = process.env.PAYLOAD_FRAMEWORK || 'next'

  // A test suite that ships its own standalone TanStack app
  // (`test/<suite>/app-tanstack`) generates its importMap there; everyone else
  // falls back to the shippable root app. Mirrors the per-suite app dir model.
  const tanstackSuiteAppDir = path.resolve(dirname, testSuiteArg, 'app-tanstack')
  const tanstackAppDir = fs.existsSync(tanstackSuiteAppDir)
    ? tanstackSuiteAppDir
    : path.resolve(dirname, 'app-tanstack')

  const importMapPath: string =
    framework === 'tanstack-start'
      ? path.resolve(tanstackAppDir, 'app/_payload/importMap.js')
      : path.resolve(getNextRootDir(testSuiteArg).rootDir, './app/(payload)/admin/importMap.js')

  try {
    fs.writeFileSync(importMapPath, 'export const importMap = {}')
  } catch (error) {
    console.log('Error writing importMap.js', error)
  }

  if (writeDBAdapter === 'true') {
    const dbAdapter: DatabaseAdapterType =
      (process.env.PAYLOAD_DATABASE as DatabaseAdapterType) || 'mongodb'
    generateDatabaseAdapter(dbAdapter)
  }

  if (skipGenImportMap === 'true') {
    console.log('Done')
    return
  }

  // Generate importMap
  const testDir = path.resolve(dirname, testSuiteArg)
  console.log('Generating import map for config:', testDir)

  const configUrl = pathToFileURL(path.resolve(testDir, configFile ?? 'config.ts')).href
  const config: SanitizedConfig = await (await import(configUrl)).default

  if (framework === 'tanstack-start') {
    // ROOT_DIR drives import map auto-discovery; point it at the app that owns the
    // generated importMap so the `app/_payload/` convention resolves on its own.
    process.env.ROOT_DIR = tanstackAppDir
  } else {
    process.env.ROOT_DIR = getNextRootDir(testSuiteArg).rootDir
  }

  await generateImportMap(config, { log: true, force: true })

  console.log('Done')
}

if (runImmediately === 'true') {
  const testSuiteArg = process.argv[3]
  const writeDBAdapter = process.argv[4]
  const skipGenImportMap = process.argv[5]
  void initDevAndTest(testSuiteArg, writeDBAdapter, skipGenImportMap)
}
