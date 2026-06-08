import { existsSync, mkdirSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'

import type { ConfigSnapshot } from './types.js'

const SNAPSHOT_FILENAME = 'payload-config-snapshot.json'

function snapshotPath(migrationDir: string): string {
  return path.join(migrationDir, SNAPSHOT_FILENAME)
}

export async function readConfigState(migrationDir: string): Promise<ConfigSnapshot | null> {
  const filePath = snapshotPath(migrationDir)
  if (!existsSync(filePath)) {
    return null
  }
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content) as ConfigSnapshot
  } catch {
    return null
  }
}

export async function writeConfigState(
  migrationDir: string,
  snapshot: ConfigSnapshot,
): Promise<void> {
  if (!existsSync(migrationDir)) {
    mkdirSync(migrationDir, { recursive: true })
  }
  await fs.writeFile(snapshotPath(migrationDir), JSON.stringify(snapshot, null, 2))
}
