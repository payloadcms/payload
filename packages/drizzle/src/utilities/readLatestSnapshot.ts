import { readdirSync, readFileSync } from 'fs'

import type { DrizzleAdapter } from '../types.js'

/** The latest snapshot in the migrations directory, upgraded to drizzle-kit's current format. */
export async function readLatestSnapshot<TSnapshot extends { version: string }>({
  adapter,
}: {
  adapter: DrizzleAdapter
}): Promise<TSnapshot | undefined> {
  const dir = adapter.migrationDir
  const latestSnapshotFile = readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .reverse()[0]

  if (!latestSnapshotFile) {
    return undefined
  }

  const { generateDrizzleJson, upSnapshot } = await adapter.requireDrizzleKit()
  const currentVersion = (await generateDrizzleJson(adapter.schema)).version
  const snapshot = JSON.parse(readFileSync(`${dir}/${latestSnapshotFile}`, 'utf8')) as TSnapshot

  return (
    upSnapshot && snapshot.version < currentVersion ? upSnapshot(snapshot) : snapshot
  ) as TSnapshot
}
