import fs from 'fs'
import path from 'path'

// import type { Payload } from '../../'
// import type { Migration } from '../types'

/**
 * Read the migration files from disk
 */
export const readMigrationFiles = async ({
  payload,
}: {
  payload: Payload
}): Promise<Migration[]> => {
  if (!fs.existsSync(payload.db.migrationDir)) {
    payload.logger.debug({
      msg: `No migration directory found at ${payload.db.migrationDir}`,
    })
    return []
  }

  const files = fs
    .readdirSync(payload.db.migrationDir)
    .sort()
    .filter((f) => f.endsWith('.ts'))
    .map((file) => {
      return path.resolve(payload.db.migrationDir, file)
    })

  return files

  // return files.map((filePath) => {
  //   // eslint-disable-next-line @typescript-eslint/no-var-requires,import/no-dynamic-require
  //   const migration = require(filePath) as Migration
  //   migration.name = path.basename(filePath).split('.')?.[0]
  //   return migration
  // })
}
