import fs from 'fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { generateImportMap, type SanitizedConfig } from 'payload'

import type { allDatabaseAdapters } from './generateDatabaseAdapter.js'

import { getNextRootDir } from './__helpers/shared/getNextRootDir.js'
import { generateDatabaseAdapter } from './generateDatabaseAdapter.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const runImmediately = process.argv[2]

export async function initDevAndTest(
  testSuiteArg: string,
  writeDBAdapter: string,
  skipGenImportMap: string,
  configFile?: string,
): Promise<void> {
  // Determine target root dir — env var takes precedence (set by dev-tanstack.ts)
  const targetRootDir = process.env.ROOT_DIR ?? getNextRootDir(testSuiteArg).rootDir
  // TanStack Start apps have app.config.ts; Next.js apps have app/(payload) structure
  const isTanstackApp = fs.existsSync(path.resolve(targetRootDir, 'app.config.ts'))
  const importMapRelativePath = isTanstackApp
    ? './app/importMap.js'
    : './app/(payload)/admin/importMap.js'
  const importMapPath: string = path.resolve(targetRootDir, importMapRelativePath)

  try {
    fs.writeFileSync(importMapPath, 'export const importMap = {}')
  } catch (error) {
    console.log('Error writing importMap.js', error)
  }

  if (writeDBAdapter === 'true') {
    const dbAdapter: keyof typeof allDatabaseAdapters =
      (process.env.PAYLOAD_DATABASE as keyof typeof allDatabaseAdapters) || 'mongodb'
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

  // Only set ROOT_DIR if not already set (dev-tanstack.ts may have set it)
  if (!process.env.ROOT_DIR) {
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
