import fs from 'fs'
import path from 'path'

import type { Payload } from '../../index.js'
import type { Migration } from '../types.js'

/**
 * Read the migration files from disk
 */
export const readMigrationFiles = async ({
  migrationDir: migrationDirOverride,
  payload,
}: {
  migrationDir?: string
  payload: Payload
}): Promise<Migration[]> => {
  const migrationDir = migrationDirOverride || payload.db.migrationDir

  if (!fs.existsSync(migrationDir)) {
    payload.logger.error({
      msg: `No migration directory found at ${migrationDir}`,
    })
    return []
  }

  payload.logger.info({
    msg: `Reading migration files from ${migrationDir}`,
  })

  const files = fs
    .readdirSync(migrationDir)
    .sort()
    .filter((f) => {
      return f.endsWith('.ts') || f.endsWith('.js')
    })
    .map((file) => {
      return path.resolve(migrationDir, file)
    })

  return Promise.all(
    files.map(async (filePath) => {
      // eval used to circumvent errors bundling
      let migration = await eval(
        `${typeof require === 'function' ? 'require' : 'import'}('${filePath.replaceAll('\\', '/')}')`,
      )
      if ('default' in migration) migration = migration.default

      const result: Migration = {
        name: path.basename(filePath).split('.')?.[0],
        down: migration.down,
        up: migration.up,
      }

      return result
    }),
  )
}
