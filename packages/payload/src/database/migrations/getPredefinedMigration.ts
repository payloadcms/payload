import fs from 'fs'
import path from 'path'

import type { Payload } from '../../index.js'
import type { MigrationTemplateArgs } from '../types.js'

import { dynamicImport } from '../../utilities/dynamicImport.js'

/**
 * Get predefined migration 'up', 'down' and 'imports'.
 *
 * Supports two import methods:
 * 1. @payloadcms/db-* packages: Loads from adapter's predefinedMigrations folder directly (no package.json export needed)
 *    Example: `--file @payloadcms/db-mongodb/relationships-v2-v3`
 * 2. Any other package/path: Uses dynamic import via package.json exports or absolute file paths
 *    Example: `--file @payloadcms/plugin-seo/someMigration` or `--file /absolute/path/to/migration.ts`
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
  const importPath = file ?? migrationNameArg

  // Path 1: @payloadcms/db-* adapters - load directly from predefinedMigrations folder
  // These don't need package.json exports; files are resolved relative to adapter's dirname
  if (importPath?.startsWith('@payloadcms/db-')) {
    const migrationName = importPath.split('/').slice(2).join('/')
    let cleanPath = path.join(dirname, `./predefinedMigrations/${migrationName}`)
    if (fs.existsSync(`${cleanPath}.mjs`)) {
      cleanPath = `${cleanPath}.mjs`
    } else if (fs.existsSync(`${cleanPath}.js`)) {
      cleanPath = `${cleanPath}.js`
    } else if (fs.existsSync(`${cleanPath}.ts`)) {
      // Support .ts in development when running from source
      cleanPath = `${cleanPath}.ts`
    } else {
      payload.logger.error({
        msg: `Canned migration ${migrationName} not found.`,
      })
      process.exit(1)
    }
    cleanPath = cleanPath.replaceAll('\\', '/')
    try {
      const { downSQL, dynamic, imports, upSQL } =
        await dynamicImport<MigrationTemplateArgs>(cleanPath)
      return {
        downSQL,
        dynamic,
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
    // Path 2: Any other package or file path - use dynamic import
    // Supports: package.json exports (e.g. @payloadcms/plugin-seo/migration) or absolute file paths
    try {
      const { downSQL, dynamic, imports, upSQL } =
        await dynamicImport<MigrationTemplateArgs>(importPath)
      return {
        downSQL,
        dynamic,
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
