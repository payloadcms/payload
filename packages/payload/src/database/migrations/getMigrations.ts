import type { Payload } from '../..'
import type { MigrationData } from '../types'

export async function getMigrations({
  payload,
}: {
  payload: Payload
}): Promise<{ existingMigrations: MigrationData[]; latestBatch: number }> {
  const migrationQuery = await payload.find({
    collection: 'payload-migrations',
    limit: 0,
    sort: '-name',
  })

  const existingMigrations = migrationQuery.docs as unknown as MigrationData[]

  // Get the highest batch number from existing migrations
  const latestBatch = Number(existingMigrations?.[0]?.batch) || 0

  return {
    existingMigrations,
    latestBatch,
  }
}
