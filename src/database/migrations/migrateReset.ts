/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { DatabaseAdapter } from '../types';
import { getMigrations } from './getMigrations';
import { readMigrationFiles } from './readMigrationFiles';

export async function migrateReset(this: DatabaseAdapter): Promise<void> {
  const { payload } = this;
  const migrationFiles = await readMigrationFiles({ payload });

  const { existingMigrations } = await getMigrations({ payload });

  if (!existingMigrations?.length) {
    payload.logger.info({ msg: 'No migrations to reset.' });
    return;
  }

  // Rollback all migrations in order
  for (const migration of migrationFiles) {
    // Create or update migration in database
    const existingMigration = existingMigrations.find((existing) => existing.name === migration.name);
    if (existingMigration) {
      payload.logger.info({ msg: `Migrating: ${migration.name}` });
      try {
        const start = Date.now();
        await migration.down({ payload });
        payload.logger.info({ msg: `Migrated:  ${migration.name} (${Date.now() - start}ms)` });
      } catch (err: unknown) {
        payload.logger.error({ msg: `Error running migration ${migration.name}`, err });
        throw err;
      }

      await payload.delete({
        collection: 'payload-migrations',
        where: {
          id: {
            equals: existingMigration.id,
          },
        },
      });
    }
  }
}
