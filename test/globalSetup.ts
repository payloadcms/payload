import type { TestProject } from 'vitest/node'

import startMemoryDB from './helpers/startMemoryDB.js'
import stopMemoryDB from './helpers/stopMemoryDB.js'

export async function setup(_project: TestProject) {
  await startMemoryDB()
}

export function teardown() {
  stopMemoryDB()
}
