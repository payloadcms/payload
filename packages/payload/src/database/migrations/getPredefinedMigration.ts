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
  const importPath = file ?? migrationNameArg

  if (importPath?.startsWith('@payloadcms/db-')) {
    // removes the package name from the migrationName.
    const migrationName = importPath.split('/').slice(2).join('/')
    let cleanPath = path.join(dirname, `./predefinedMigrations/${migrationName}`)
    if (fs.existsSync(`${cleanPath}.mjs`)) {
      cleanPath = `${cleanPath}.mjs`
    } else if (fs.existsSync(`${cleanPath}.js`)) {
      cleanPath = `${cleanPath}.js`
    } else {
      payload.logger.error({
        msg: `Canned migration ${migrationName} not found.`,
      })
      process.exit(1)
    }
    cleanPath = cleanPath.replaceAll('\\', '/')
    const moduleURL = pathToFileURL(cleanPath)
    try {
      const { downSQL, imports, upSQL } = await eval(`import('${moduleURL.href}')`)
      return {
        downSQL,
        imports,
        upSQL,
      }
    } catch (err) {
      payload.logger.error({
        err,
        msg: `Error loading predefined migration ${migrationName}`,
      })
      process.exit(1)
    }
  } else if (importPath) {
    try {
      const { downSQL, imports, upSQL } = await eval(`import('${importPath}')`)
      return {
        downSQL,
        imports,
        upSQL,
      }
    } catch (_err) {
      if (importPath?.includes('/')) {
        // We can assume that the intent was to import a file, thus we throw an error.
        throw new Error(`Error importing migration file from ${importPath}`)
      }
      // Silently fail. If the migration cannot be imported, it will be created as a blank migration and the import path will be used as the migration name.
      return {}
    }
  }
  return {}
}
