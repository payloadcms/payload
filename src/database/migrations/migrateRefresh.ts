/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { DatabaseAdapter, Migration } from '../types';
import { readMigrationFiles } from './readMigrationFiles';

export async function migrateRefresh(this: DatabaseAdapter) {
  const { payload } = this;
  const migrationFiles = await readMigrationFiles({ payload });
  const migrationQuery = await payload.update({
    collection: 'payload-migrations',
    data: {
      executed: false,
    },
    where: {}, // All migrations
  });

  const existingMigrations = migrationQuery.docs as unknown as Migration[];

  for (const migration of migrationFiles) {
    // Create or update migration in database
    const existingMigration = existingMigrations.find((existing) => existing.name === migration.name);

    // Run migration if not found in database
    payload.logger.info({ msg: `Running migration ${migration.name}...` });
    if (!existingMigration || !existingMigration?.ran) {
      try {
        await migration.up({ payload });
      } catch (err: unknown) {
        payload.logger.error({ msg: `Error running migration ${migration.name}`, err });
        throw err;
      }

      payload.logger.info({ msg: `${migration.name} done.` });

      if (!existingMigration) {
        await payload.create({
          collection: 'payload-migrations',
          data: {
            name: migration.name,
            executed: true,
          },
        });
      } else {
        await payload.update({
          collection: 'payload-migrations',
          id: existingMigration.id,
          data: {
            executed: true,
          },
        });
      }
    } else {
      payload.logger.info({ msg: `${migration.name} already executed.` });
    }
  }
}
