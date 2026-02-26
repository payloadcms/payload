import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { allDatabaseAdapters } from './generateDatabaseAdapter.js'

import { generateDatabaseAdapter } from './generateDatabaseAdapter.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const runImmediately = process.argv[2]

export async function initDevAndTest(
  testSuiteArg: string,
  writeDBAdapter: string,
  _skipGenImportMap: string,
  configFile?: string,
): Promise<void> {
  if (writeDBAdapter === 'true') {
    const dbAdapter: keyof typeof allDatabaseAdapters =
      (process.env.PAYLOAD_DATABASE as keyof typeof allDatabaseAdapters) || 'mongodb'
    generateDatabaseAdapter(dbAdapter)
  }

  console.log('Done')
}

if (runImmediately === 'true') {
  const testSuiteArg = process.argv[3]
  const writeDBAdapter = process.argv[4]
  const skipGenImportMap = process.argv[5]
  void initDevAndTest(testSuiteArg, writeDBAdapter, skipGenImportMap)
}
