import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

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
  file?: string
  migrationName?: string
  payload: Payload
}): Promise<MigrationTemplateArgs> => {
  // Check for predefined migration.
  // Either passed in via --file or prefixed with '@payloadcms/db-mongodb/' for example
  if (file || migrationNameArg?.startsWith('@payloadcms/')) {
    // removes the package name from the migrationName.
    const migrationName = (file || migrationNameArg).split('/').slice(2).join('/')
    let cleanPath = path.join(dirname, `./predefinedMigrations/${migrationName}.mjs`)

    // Check if predefined migration exists
    if (fs.existsSync(cleanPath)) {
      cleanPath = cleanPath.replaceAll('\\', '/')
      const moduleURL = pathToFileURL(cleanPath)
      try {
        const { downSQL, imports, upSQL } = await import(moduleURL.href)
        return { downSQL, imports, upSQL }
      } catch (error) {
        payload.logger.error({
          error,
          msg: `Error loading predefined migration ${migrationName}`,
        })
        process.exit(1)
      }
    } else {
      payload.logger.error({
        msg: `Canned migration ${migrationName} not found.`,
      })
      process.exit(1)
    }
  }
  return {}
}
