import { Table } from 'console-table-printer'

import type { BaseDatabaseAdapter } from '../types'

import { getMigrations } from './getMigrations'
import { readMigrationFiles } from './readMigrationFiles'

export async function migrateStatus(this: BaseDatabaseAdapter): Promise<void> {
  const { payload } = this
  const migrationFiles = await readMigrationFiles({ payload })

  payload.logger.debug({
    msg: `Found ${migrationFiles.length} migration files.`,
  })

  const { existingMigrations } = await getMigrations({ payload })

  if (!migrationFiles.length) {
    payload.logger.info({ msg: 'No migrations found.' })
    return
  }

  // Compare migration files to existing migrations
  const statuses = migrationFiles.map((migration) => {
    const existingMigration = existingMigrations.find((m) => m.name === migration.name)
    return {
      Name: migration.name,
      // eslint-disable-next-line perfectionist/sort-objects
      Batch: existingMigration?.batch,
      Ran: existingMigration ? 'Yes' : 'No',
    }
  })

  const p = new Table()

  statuses.forEach((s) => {
    p.addRow(s, {
      color: s.Ran === 'Yes' ? 'green' : 'red',
    })
  })
  p.printTable()
}
