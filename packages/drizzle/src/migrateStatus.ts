import type { MigrationStatus } from 'payload'

import { Table } from 'console-table-printer'
import { getMigrations, readMigrationFiles } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { migrationTableExists } from './utilities/migrationTableExists.js'

export async function migrateStatus(this: DrizzleAdapter): Promise<MigrationStatus[]> {
  const { payload } = this
  const migrationFiles = await readMigrationFiles({ payload })

  payload.logger.debug({
    msg: `Found ${migrationFiles.length} migration files.`,
  })

  let existingMigrations = []
  const hasMigrationTable = await migrationTableExists(this)

  if (hasMigrationTable) {
    ;({ existingMigrations } = await getMigrations({ payload }))
  }

  if (!migrationFiles.length) {
    payload.logger.info({ msg: 'No migrations found.' })
    return []
  }

  // Compare migration files to existing migrations
  const statuses = migrationFiles.map((migration) => {
    const existingMigration = existingMigrations.find((m) => m.name === migration.name)
    return {
      name: migration.name,
      batch: existingMigration?.batch,
      ran: Boolean(existingMigration),
    }
  })

  const p = new Table()

  statuses.forEach((s) => {
    p.addRow(
      { Batch: s.batch, Name: s.name, Ran: s.ran ? 'Yes' : 'No' },
      {
        color: s.ran ? 'green' : 'red',
      },
    )
  })
  p.printTable()

  return statuses
}
