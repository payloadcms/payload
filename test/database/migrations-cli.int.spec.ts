/**
 * Standalone CLI migration tests.
 *
 * These tests verify that predefined migrations are correctly imported and created via the CLI.
 * Isolated from the main database tests to avoid connection pool issues since migrateCLI
 * creates its own Payload instance internally.
 */
import fs from 'fs'
import path from 'path'
import { migrateCLI } from 'payload'
import { fileURLToPath } from 'url'
import { afterEach, beforeEach, expect } from 'vitest'

import { removeFiles } from '../__helpers/shared/removeFiles.js'
import { describe, it } from '../__helpers/int/vitest.js'
import configPromise from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const migrationDir = path.join(dirname, './migrations')

describe('migrations CLI', () => {
  afterEach(() => {
    removeFiles(migrationDir)
  })

  beforeEach(() => {
    removeFiles(migrationDir)
  })

  it('should create migration from external file path via CLI (plugin predefined migration)', async () => {
    // Tests: Absolute file path imports (goes through Path 2 in getPredefinedMigration.ts)
    // Example: pnpm payload migrate:create --file /absolute/path/to/migration.ts

    const config = await configPromise
    const predefinedMigrationPath = path.join(
      dirname,
      './predefinedMigrations/testPluginMigration.ts',
    )

    // Use the CLI interface directly, simulating:
    // pnpm payload migrate:create --file /path/to/predefinedMigrations/testPluginMigration.ts
    await migrateCLI({
      config,
      migrationDir,
      parsedArgs: {
        _: ['migrate:create'],
        file: predefinedMigrationPath,
        forceAcceptWarning: true,
      },
    })

    // Find the created migration file
    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

    expect(migrationFiles.length).toBe(1)

    const migrationContent = fs.readFileSync(path.join(migrationDir, migrationFiles[0]!), 'utf8')

    // Verify the migration contains the predefined SQL from the plugin
    expect(migrationContent).toContain('Test predefined migration UP from plugin')
    expect(migrationContent).toContain('Test predefined migration DOWN from plugin')
    expect(migrationContent).toContain("import { sql } from 'drizzle-orm'")
  })

  it(
    'should create migration from @payloadcms/db-* adapter predefinedMigrations folder',
    { db: 'mongo' },
    async () => {
      // Tests: Path 1 in getPredefinedMigration.ts - @payloadcms/db-* prefix handling
      // These load directly from adapter's predefinedMigrations folder WITHOUT package.json exports
      // Example: pnpm payload migrate:create --file @payloadcms/db-mongodb/__testing__

      const config = await configPromise

      // Use the CLI interface directly, simulating:
      // pnpm payload migrate:create --file @payloadcms/db-mongodb/__testing__
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create'],
          file: '@payloadcms/db-mongodb/__testing__',
          forceAcceptWarning: true,
        },
      })

      // Find the created migration file
      const migrationFiles = fs
        .readdirSync(migrationDir)
        .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))
      expect(migrationFiles.length).toBe(1)

      const migrationContent = fs.readFileSync(path.join(migrationDir, migrationFiles[0]!), 'utf8')

      // Verify the migration contains the predefined content from the package export
      expect(migrationContent).toContain(
        'Test predefined migration from @payloadcms/db-mongodb/__testing__',
      )
    },
  )

  it('should create migration from package.json export (non-db package)', async () => {
    // Tests: Path 2 in getPredefinedMigration.ts - module specifier via package.json exports
    // Packages WITHOUT @payloadcms/db-* prefix MUST use package.json exports
    // Example: pnpm payload migrate:create --file payload/__testing__/predefinedMigration

    const config = await configPromise

    // Use the CLI interface directly, simulating:
    // pnpm payload migrate:create --file payload/__testing__/predefinedMigration
    // payload/__testing__/predefinedMigration is explicitly defined in payload's package.json exports
    await migrateCLI({
      config,
      migrationDir,
      parsedArgs: {
        _: ['migrate:create'],
        file: 'payload/__testing__/predefinedMigration',
        forceAcceptWarning: true,
      },
    })

    // Find the created migration file
    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))
    expect(migrationFiles.length).toBe(1)

    const migrationContent = fs.readFileSync(path.join(migrationDir, migrationFiles[0]!), 'utf8')

    // Verify the migration contains the predefined content from the payload package export
    expect(migrationContent).toContain(
      'Test predefined migration from payload/__testing__/predefinedMigration',
    )
  })
})
