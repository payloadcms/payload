/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { DatabaseAdapter, Migration } from '../types';
import { readMigrationFiles } from './readMigrationFiles';

export async function migrateReset(this: DatabaseAdapter): Promise<void> {
  const { payload } = this;
  const migrationFiles = await readMigrationFiles({ payload });
  const migrationQuery = await payload.find({
    collection: 'payload-migrations',
    sort: '-name', // Q: Will this always be the most recent by sorting alphabetically?
  });

  const existingMigrations = migrationQuery.docs as unknown as Migration[];
  if (!existingMigrations?.length) {
    payload.logger.info({ msg: 'No migrations to reset.' });
    return;
  }

  // Rollback all migrations in order
  for (const migration of migrationFiles) {
    payload.logger.info({ msg: `Evaluating migration ${migration.name}...` });

    // Create or update migration in database
    const existingMigration = existingMigrations.find((existing) => existing.name === migration.name);
    if (existingMigration?.ran) {
      try {
        await migration.down({ payload });
      } catch (err: unknown) {
        payload.logger.error({ msg: `Error running migration ${migration.name}`, err });
        throw err;
      }

      payload.logger.info({ msg: `${migration.name} down done.` });

      await payload.update({
        collection: 'payload-migrations',
        data: {
          ran: false,
        },
        where: {
          id: {
            equals: existingMigration.id,
          },
        },
      });
    }
  }
}
