import fs from 'fs'
import path from 'path'

import type { Payload } from '../../index.js'
import type { MigrationTemplateArgs } from '../types.js'

/**
 * Get predefined migration 'up', 'down' and 'imports'
 */
export const getPredefinedMigration = async ({
  dirname,
  file,
  migrationName: migrationNameArg,
  payload,
}: {
  dirname: string
  file: string
  migrationName: string
  payload: Payload
}): Promise<MigrationTemplateArgs> => {
  // Check for predefined migration.
  // Either passed in via --file or prefixed with '@payloadcms/db-mongodb/' for example
  if (file || migrationNameArg.startsWith('@payloadcms/')) {
    // removes the package name from the migrationName.
    const migrationName = migrationNameArg.split('/').slice(2).join('/')
    const cleanPath = path.join(dirname, `./predefinedMigrations/${migrationName}.js`)

    // Check if predefined migration exists
    if (fs.existsSync(cleanPath)) {
      let migration: MigrationTemplateArgs = await eval(
        `${typeof require === 'function' ? 'require' : 'import'}(${cleanPath})`,
      )
      if ('default' in migration) migration = migration.default
      return migration
    } else {
      payload.logger.error({
        msg: `Canned migration ${migrationName} not found.`,
      })
      process.exit(1)
    }
  }
}
