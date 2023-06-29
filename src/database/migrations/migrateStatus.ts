/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { Table } from 'console-table-printer';
import { DatabaseAdapter, MigrationData } from '../types';
import { readMigrationFiles } from './readMigrationFiles';

export async function migrateStatus(this: DatabaseAdapter): Promise<void> {
  const { payload } = this;
  const migrationFiles = await readMigrationFiles({ payload });
  const migrationQuery = await payload.find({
    collection: 'payload-migrations',
  });

  const existingMigrations = migrationQuery.docs as unknown as MigrationData[];

  // Compare migration files to existing migrations
  const statuses = migrationFiles.map((migration) => {
    const existingMigration = existingMigrations.find(
      (m) => m.name === migration.name,
    );
    return {
      name: migration.name,
      ran: !!existingMigration,
    };
  });

  const p = new Table();

  statuses.forEach((s) => {
    p.addRow(s, {
      color: s.ran ? 'green' : 'red',
    });
  });
  p.printTable();
}
