import { DatabaseAdapter, Migration } from '../types';
import { readMigrationFiles } from './readMigrationFiles';

export async function migrateDown(this: DatabaseAdapter): Promise<void> {
  const { payload } = this;
  const migrationFiles = await readMigrationFiles({ payload });

  const migrationQuery = await payload.find({
    collection: 'payload-migrations',
    sort: '-name', // Q: Will this always be the most recent by sorting alphabetically?
    where: {
      ran: {
        equals: true,
      },
    },
  });

  const existingMigrations = migrationQuery.docs as unknown as Migration[];

  if (existingMigrations?.length) {
    const migration = migrationFiles.find((m) => m.name === existingMigrations[0].name);
    if (!migration) {
      throw new Error(`Migration ${existingMigrations[0].name} not found locally.`);
    }

    try {
      await migration.down({ payload });

      payload.logger.info({ msg: `${migration.name} down done.` });

      await payload.update({
        collection: 'payload-migrations',
        id: existingMigrations[0].id,
        data: {
          ran: false,
        },
      });
    } catch (err: unknown) {
      payload.logger.error({ msg: `Error running migration ${migration.name}`, err });
      throw err;
    }
  } else {
    payload.logger.info({ msg: 'No migrations to reset.' });
  }
}
