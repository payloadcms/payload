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
import { afterEach, beforeEach, expect, vi } from 'vitest'

import { describe, it } from '../__helpers/int/vitest.js'
import { removeFiles } from '../__helpers/shared/removeFiles.js'
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

  it(
    'should exit with code 2 via --dry-run when no schema changes',
    { db: 'drizzle' },
    async () => {
      const config = await configPromise

      // First create a baseline migration so there's a schema snapshot
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'baseline'],
          forceAcceptWarning: true,
        },
      })

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`)
      })

      await expect(
        migrateCLI({
          config,
          migrationDir,
          parsedArgs: {
            _: ['migrate:create', 'test_dry_run'],
            dryRun: true,
            skipEmpty: true,
          },
        }),
      ).rejects.toThrow('process.exit(2)')

      // Verify no new migration files written (only baseline + index)
      const migrationFiles = fs
        .readdirSync(migrationDir)
        .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

      expect(migrationFiles.length).toBe(1) // only the baseline

      exitSpy.mockRestore()
    },
  )

  it(
    'should exit with code 2 via --dry-run without --skip-empty when no schema changes',
    { db: 'drizzle' },
    async () => {
      const config = await configPromise

      // Create baseline so schema is in sync
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'baseline'],
          forceAcceptWarning: true,
        },
      })

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`)
      })

      await expect(
        migrateCLI({
          config,
          migrationDir,
          parsedArgs: {
            _: ['migrate:create', 'test_dry_run_no_flags'],
            dryRun: true,
          },
        }),
      ).rejects.toThrow('process.exit(2)')

      const migrationFiles = fs
        .readdirSync(migrationDir)
        .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

      expect(migrationFiles.length).toBe(1) // only the baseline

      exitSpy.mockRestore()
    },
  )

  it('should exit with code 2 via --dry-run on MongoDB', { db: 'mongo' }, async () => {
    const config = await configPromise

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`)
    })

    await expect(
      migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'test_mongo_dryrun'],
          dryRun: true,
        },
      }),
    ).rejects.toThrow('process.exit(2)')

    exitSpy.mockRestore()
  })

  it('should create migration from --from-stdin JSON', async () => {
    const config = await configPromise

    const stdinJSON = JSON.stringify({
      downSQL: '  await db.execute(sql`DROP TABLE IF EXISTS "test_table";`)',
      upSQL: '  await db.execute(sql`CREATE TABLE "test_table" ("id" serial PRIMARY KEY);`)',
    })

    await migrateCLI({
      config,
      migrationDir,
      parsedArgs: {
        _: ['migrate:create', 'from_stdin_test'],
        forceAcceptWarning: true,
        fromStdin: stdinJSON,
      },
    })

    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

    expect(migrationFiles.length).toBe(1)

    const content = fs.readFileSync(path.join(migrationDir, migrationFiles[0]!), 'utf8')

    expect(content).toContain('CREATE TABLE "test_table"')
    expect(content).toContain('DROP TABLE IF EXISTS "test_table"')
  })

  it('should return error for --from-stdin with invalid JSON', async () => {
    const config = await configPromise

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    try {
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'bad_json'],
          forceAcceptWarning: true,
          fromStdin: 'not valid json{{{',
        },
      })
    } catch {
      // Expected: process.exit(1) for error
    }

    // No migration files should be created
    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

    expect(migrationFiles.length).toBe(0)

    exitSpy.mockRestore()
  })

  it('should return error for --from-stdin missing upSQL', async () => {
    const config = await configPromise

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    try {
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'missing_upsql'],
          forceAcceptWarning: true,
          fromStdin: JSON.stringify({ downSQL: 'DROP TABLE foo;' }),
        },
      })
    } catch {
      // Expected: process.exit(1) for error
    }

    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

    expect(migrationFiles.length).toBe(0)

    exitSpy.mockRestore()
  })

  it(
    'should return error for --from-stdin without migrationName on MongoDB',
    { db: 'mongo' },
    async () => {
      const config = await configPromise

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`)
      })

      await expect(
        migrateCLI({
          config,
          migrationDir,
          parsedArgs: {
            _: ['migrate:create'],
            fromStdin: JSON.stringify({ upSQL: 'db.collection.insertOne({})' }),
          },
        }),
      ).rejects.toThrow('process.exit(1)')

      // No migration files created (not even timestamp_undefined.ts)
      const migrationFiles = fs
        .readdirSync(migrationDir)
        .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

      expect(migrationFiles.length).toBe(0)

      exitSpy.mockRestore()
    },
  )

  it('should return error when --from-stdin and --file are both provided', async () => {
    const config = await configPromise

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    try {
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'conflict_test'],
          file: '/some/path.ts',
          forceAcceptWarning: true,
          fromStdin: JSON.stringify({ upSQL: 'SELECT 1;' }),
        },
      })
    } catch {
      // Expected error
    }

    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

    expect(migrationFiles.length).toBe(0)

    exitSpy.mockRestore()
  })

  it('should return error when --from-stdin and --dry-run are both provided', async () => {
    const config = await configPromise

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    try {
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'stdin_dryrun'],
          dryRun: true,
          forceAcceptWarning: true,
          fromStdin: JSON.stringify({ upSQL: 'SELECT 1;' }),
        },
      })
    } catch {
      // Expected error
    }

    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

    expect(migrationFiles.length).toBe(0)

    exitSpy.mockRestore()
  })

  it(
    'should exit with code 2 when --skipEmpty and no schema changes',
    { db: 'drizzle' },
    async () => {
      const config = await configPromise

      // Create baseline so schema is in sync
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'baseline'],
          forceAcceptWarning: true,
        },
      })

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`)
      })

      await expect(
        migrateCLI({
          config,
          migrationDir,
          parsedArgs: {
            _: ['migrate:create', 'should_be_empty'],
            skipEmpty: true,
          },
        }),
      ).rejects.toThrow('process.exit(2)')

      exitSpy.mockRestore()
    },
  )

  it('should output valid JSON with --json --dry-run combined', { db: 'drizzle' }, async () => {
    const config = await configPromise

    const stdoutChunks: string[] = []
    const originalWrite = process.stdout.write
    process.stdout.write = (chunk: string | Uint8Array) => {
      stdoutChunks.push(chunk.toString())
      return true
    }

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    try {
      // Create baseline first
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'json_baseline'],
          forceAcceptWarning: true,
        },
      })

      stdoutChunks.length = 0 // Clear baseline output

      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'json_dry_run'],
          dryRun: true,
          json: true,
          skipEmpty: true,
        },
      })
    } catch {
      // exit(2) expected for dry-run with no changes
    } finally {
      process.stdout.write = originalWrite
      exitSpy.mockRestore()
    }

    const jsonLine = stdoutChunks.find((c) => c.startsWith('{'))
    expect(jsonLine).toBeDefined()

    const result = JSON.parse(jsonLine!)

    expect(result.hasChanges).toBe(false)
    expect(typeof result.status).toBe('string')
  })

  it(
    'should output JSON with correct shape when --json flag is used on creation',
    { db: 'drizzle' },
    async () => {
      const config = await configPromise

      const stdoutChunks: string[] = []
      const originalWrite = process.stdout.write
      process.stdout.write = (chunk: string | Uint8Array) => {
        stdoutChunks.push(chunk.toString())
        return true
      }

      try {
        await migrateCLI({
          config,
          migrationDir,
          parsedArgs: {
            _: ['migrate:create', 'json_creation_test'],
            forceAcceptWarning: true,
            json: true,
          },
        })
      } finally {
        process.stdout.write = originalWrite
      }

      const jsonLine = stdoutChunks.find((c) => c.startsWith('{'))
      expect(jsonLine).toBeDefined()

      const result = JSON.parse(jsonLine!)

      expect(result.status).toBe('created')
      expect(result.filePath).toBeDefined()
      expect(result.migrationName).toBeDefined()
      expect(typeof result.hasChanges).toBe('boolean')
    },
  )

  it(
    'should output JSON error shape with --json flag when error occurs in migrate:create',
    { db: 'drizzle' },
    async () => {
      const config = await configPromise

      const stdoutChunks: string[] = []
      const originalWrite = process.stdout.write
      process.stdout.write = (chunk: string | Uint8Array) => {
        stdoutChunks.push(chunk.toString())
        return true
      }

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`)
      })

      try {
        await migrateCLI({
          config,
          migrationDir,
          parsedArgs: {
            _: ['migrate:create', 'json_error_test'],
            fromStdin: 'invalid json{{{',
            json: true,
          },
        })
      } catch {
        // process.exit(1) expected
      } finally {
        process.stdout.write = originalWrite
        exitSpy.mockRestore()
      }

      const jsonLine = stdoutChunks.find((c) => c.startsWith('{'))
      expect(jsonLine).toBeDefined()

      const result = JSON.parse(jsonLine!)

      expect(result.status).toBe('error')
      expect(typeof result.error).toBe('string')
    },
  )
})
