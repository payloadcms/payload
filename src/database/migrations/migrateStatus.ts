import { DatabaseAdapter } from '../types';
import { readMigrationFiles } from './readMigrationFiles';

export async function migrateStatus(this: DatabaseAdapter) {
  const { payload } = this;
  const files = readMigrationFiles({ payload });

  const { docs: migrations } = await payload.db.find<{ name: string; batch: number }>({
    collection: 'payload-migrations',
    limit: 0,
    pagination: false,
  });

  const result = (await files).map((file) => {
    const migration = migrations.find((doc) => doc.name === file.name);
    return {
      ran: !!migration,
      migration: file.name,
      batch: migration.batch ?? null,
    };
  });

  // TODO: log as table format
  this.payload.logger.info(result);
}
