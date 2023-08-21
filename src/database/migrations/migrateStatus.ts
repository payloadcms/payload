import { Table } from 'console-table-printer';
import { DatabaseAdapter } from '../types';
import { readMigrationFiles } from './readMigrationFiles';
import { getMigrations } from './getMigrations';

export async function migrateStatus(this: DatabaseAdapter): Promise<void> {
  const { payload } = this;
  const migrationFiles = await readMigrationFiles({ payload });
  const { existingMigrations } = await getMigrations({ payload });

  if (!migrationFiles.length) {
    payload.logger.info({ msg: 'No migrations found.' });
    return;
  }

  // Compare migration files to existing migrations
  const statuses = migrationFiles.map((migration) => {
    const existingMigration = existingMigrations.find(
      (m) => m.name === migration.name,
    );
    return {
      Ran: existingMigration ? 'Yes' : 'No',
      Name: migration.name,
      Batch: existingMigration?.batch,
    };
  });

  const p = new Table();

  statuses.forEach((s) => {
    p.addRow(s, {
      color: s.Ran === 'Yes' ? 'green' : 'red',
    });
  });
  p.printTable();
}
