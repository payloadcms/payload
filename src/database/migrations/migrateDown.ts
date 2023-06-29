/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { DatabaseAdapter } from '../types';
import { getMigrations } from './getMigrations';
import { readMigrationFiles } from './readMigrationFiles';

export async function migrateDown(this: DatabaseAdapter): Promise<void> {
  const { payload } = this;
  const migrationFiles = await readMigrationFiles({ payload });

  const { existingMigrations, latestBatch } = await getMigrations({
    payload,
  });


  const migrationsToRollback = existingMigrations.filter((migration) => migration.batch === latestBatch);
  if (!migrationsToRollback?.length) {
    payload.logger.info({ msg: 'No migrations to rollback.' });
    return;
  }
  payload.logger.info({ msg: `Rolling back batch ${latestBatch} consisting of ${migrationsToRollback.length} migrations.` });

  for (const migration of migrationsToRollback) {
    const migrationFile = migrationFiles.find((m) => m.name === migration.name);
    if (!migrationFile) {
      throw new Error(`Migration ${migration.name} not found locally.`);
    }

    try {
      await migrationFile.down({ payload });

      payload.logger.info({ msg: `${migrationFile.name} down done.` });

      await payload.delete({
        collection: 'payload-migrations',
        id: migration.id,
      });
    } catch (err: unknown) {
      payload.logger.error({ msg: `Error running migration ${migrationFile.name}`, err });
      throw err;
    }
  }
}
