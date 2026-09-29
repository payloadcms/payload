import { Table } from 'console-table-printer'

import type { BaseDatabaseAdapter, MigrationStatus } from '../types.js'

import { getMigrations } from './getMigrations.js'
import { readMigrationFiles } from './readMigrationFiles.js'

export async function migrateStatus(this: BaseDatabaseAdapter): Promise<MigrationStatus[]> {
  const { payload } = this
  const migrationFiles = await readMigrationFiles({ payload })

  payload.logger.debug({
    msg: `Found ${migrationFiles.length} migration files.`,
  })

  const { existingMigrations } = await getMigrations({ payload })

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
