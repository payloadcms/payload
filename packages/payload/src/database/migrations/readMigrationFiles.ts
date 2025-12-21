import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

import type { Payload } from '../../index.js'
import type { Migration } from '../types.js'

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
      return (f.endsWith('.ts') || f.endsWith('.js')) && f !== 'index.js' && f !== 'index.ts'
    })
    .map((file) => {
      return path.resolve(payload.db.migrationDir, file)
    })

  return Promise.all(
    files.map(async (filePath) => {
      // Without the eval, the Next.js bundler will throw this error when encountering the import statement:
      // ⚠ Compiled with warnings in X.Xs
      // .../node_modules/payload/dist/database/migrations/readMigrationFiles.js
      // Critical dependency: the request of a dependency is an expression
      let migration = await eval(`import('${pathToFileURL(filePath).href}')`)
      if ('default' in migration) {
        migration = migration.default
      }

      const result: Migration = {
        name: path.basename(filePath).split('.')[0]!,
        down: migration.down,
        up: migration.up,
      }

      return result
    }),
  )
}
