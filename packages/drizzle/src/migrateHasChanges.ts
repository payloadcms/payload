import type { DrizzleSnapshotJSON } from 'drizzle-kit/api'

import { existsSync, readdirSync, readFileSync } from 'fs'

import type { DrizzleAdapter } from './types.js'

import { acceptDrizzlePrompts } from './utilities/acceptDrizzlePrompts.js'

export async function migrateHasChanges(this: DrizzleAdapter): Promise<boolean> {
  const dir = this.payload.db.migrationDir
  if (!existsSync(dir)) {
    return true
  }

  const { generateDrizzleJson, generateMigration, upSnapshot } = this.requireDrizzleKit()

  const drizzleJsonAfter = await generateDrizzleJson(this.schema)

  const latestSnapshot = readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .reverse()?.[0]

  if (!latestSnapshot) {
    return true
  }

  let drizzleJsonBefore: DrizzleSnapshotJSON = JSON.parse(
    readFileSync(`${dir}/${latestSnapshot}`, 'utf8'),
  )

  if (upSnapshot && drizzleJsonBefore.version < drizzleJsonAfter.version) {
    drizzleJsonBefore = upSnapshot(drizzleJsonBefore)
  }

  const sql = await acceptDrizzlePrompts(
    () => generateMigration(drizzleJsonBefore, drizzleJsonAfter),
    {
      silenceLogs: true,
    },
  )

  if (sql.length === 0) {
    return false
  }

  return true
}
