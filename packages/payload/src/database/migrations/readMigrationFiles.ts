import fs from 'fs'
import path from 'path'

import type { Payload } from '../../'
import type { Migration } from '../types'

/**
 * Read the migration files from disk
 */
export const readMigrationFiles = async ({
  payload,
}: {
  payload: Payload
}): Promise<Migration[]> => {
  if (!fs.existsSync(payload.db.migrationDir)) {
    payload.logger.error({
      msg: `No migration directory found at ${payload.db.migrationDir}`,
    })
    return []
  }

  payload.logger.info({
    msg: `Reading migration files from ${payload.db.migrationDir}`,
  })

  const files = fs
    .readdirSync(payload.db.migrationDir)
    .sort()
    .filter((f) => {
      return ['.ts', '.js', '.cjs', '.mjs'].some((extension => f.endsWith(extension)));
    })
    .map((file) => {
      return path.resolve(payload.db.migrationDir, file)
    })

  return files.map((filePath) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const migration = require(filePath) as Migration
    migration.name = path.basename(filePath).split('.')?.[0]
    return migration
  })
}
