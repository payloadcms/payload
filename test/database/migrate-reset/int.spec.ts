import type { Payload } from 'payload'

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import path from 'path'
import { buildConfig, getPayload } from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'
import { beforeAll, expect, it } from 'vitest'

import { describe } from '../../helpers/vitest.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

const migrationsDir = path.resolve(dirname, 'migrations')

const clearMigrations = () => {
  if (existsSync(migrationsDir)) {
    rmSync(migrationsDir, { force: true, recursive: true })
  }
}

const createMigrationFile = (name: string) => {
  const timestamp = Date.now()
  const fileName = `${timestamp}_${name}.ts`
  const filePath = path.join(migrationsDir, fileName)

  if (!existsSync(migrationsDir)) {
    mkdirSync(migrationsDir, { recursive: true })
  }

  const migrationContent = `
import type { MigrateUpArgs, MigrateDownArgs } from 'payload'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // Migration up logic
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.find({ collection: 'test-collection' }) // should not error
}
`

  writeFileSync(filePath, migrationContent)
  return fileName
}

describe(
  'migrate reset',
  { db: (type) => type.includes('mongodb') || type.includes('postgres') },
  () => {
    beforeAll(async () => {
      clearMigrations()

      const { databaseAdapter } = await import(path.resolve(dirname, '../../databaseAdapter.js'))

      const init = databaseAdapter.init

      databaseAdapter.init = ({ payload }) => {
        const adapter = init({ payload })
        adapter.migrationDir = migrationsDir
        adapter.push = false
        return adapter
      }

      const config = buildConfig({
        db: databaseAdapter,
        secret: '__test__',
        collections: [
          {
            slug: 'test-collection',
            fields: [
              {
                name: 'title',
                type: 'text',
              },
            ],
          },
        ],
      })

      payload = await getPayload({ config })
    })

    it('should create migrations and then reset them', async () => {
      // Create initial migration
      await payload.db.createMigration({ payload, migrationName: 'initial_migration' })
      await payload.db.migrate({})

      const migrations = await payload.find({ collection: 'payload-migrations' })
      expect(migrations.totalDocs).toBe(1)

      // Create another migration
      createMigrationFile('second_migration')
      await payload.db.migrate()
      const updatedMigrations = await payload.find({ collection: 'payload-migrations' })
      expect(updatedMigrations.totalDocs).toBe(2)

      // same batch create
      createMigrationFile('third_migration')
      await wait(300)
      createMigrationFile('fourth_migration')
      await payload.db.migrate()
      const afterThirdMigrations = await payload.find({ collection: 'payload-migrations' })
      expect(afterThirdMigrations.totalDocs).toBe(4)

      // Now reset migrations
      await payload.db.migrateReset()
      // should not error here
    })
  },
)
