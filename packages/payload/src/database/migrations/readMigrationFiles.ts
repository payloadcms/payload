import fs from 'fs'
import path from 'path'

import type { Payload } from '../../index.js'
import type { Migration } from '../types.js'

import { dynamicImport } from '../../utilities/dynamicImport.js'

/**
 * Read the migration files from disk
 */
export const readMigrationFiles = async ({
  payload,
}: {
  payload: Payload
}): Promise<Migration[]> => {
  const dir = payload.db.findMigrationDir()
  if (!fs.existsSync(dir)) {
    payload.logger.error({
      msg: `No migration directory found at ${dir}`,
    })
    return []
  }

  payload.logger.info({
    msg: `Reading migration files from ${dir}`,
  })

  const files = fs
    .readdirSync(dir)
    .sort()
    .filter((f) => {
      return (f.endsWith('.ts') || f.endsWith('.js')) && f !== 'index.js' && f !== 'index.ts'
    })
    .map((file) => {
      return path.resolve(dir, file)
    })

  return Promise.all(
    files.map(async (filePath) => {
      const migrationModule = await dynamicImport<
        | {
            default: Migration
          }
        | Migration
      >(filePath)
      const migration = 'default' in migrationModule ? migrationModule.default : migrationModule

      const result: Migration = {
        name: path.basename(filePath).split('.')[0]!,
        down: migration.down,
        up: migration.up,
      }

      return result
    }),
  )
}
