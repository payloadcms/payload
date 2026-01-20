import type { DrizzleSnapshotJSON } from 'drizzle-kit/api'

import { existsSync, readdirSync, readFileSync } from 'fs'

import type { DrizzleAdapter } from './types.js'

const acceptDrizzlePrompts = async <T>(
  callPrompt: () => Promise<T> | T,
  {
    silenceLogs = false,
  }: {
    silenceLogs?: boolean
  } = {},
): Promise<T> => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const write = process.stdout.write

  if (silenceLogs) {
    process.stdout.write = () => true
  }

  const promise = callPrompt()

  const interval = setInterval(
    () =>
      process.stdin.emit('keypress', '\n', {
        name: 'return',
        ctrl: false,
      }),
    25,
  )

  const res = await promise

  if (silenceLogs) {
    process.stdout.write = write
  }

  clearInterval(interval)

  return res
}

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
