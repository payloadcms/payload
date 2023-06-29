/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { DatabaseAdapter, MigrationData } from '../types';
import { readMigrationFiles } from './readMigrationFiles';

export async function migrate(this: DatabaseAdapter): Promise<void> {
  const { payload } = this;
  const migrationFiles = await readMigrationFiles({ payload });
  const migrationQuery = await this.find<MigrationData>({
    collection: 'payload-migrations',
  });

  const existingMigrations = migrationQuery.docs;

  // Execute 'up' function for each migration sequentially
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
            ran: true,
          },
        });
      } else {
        await payload.update({
          collection: 'payload-migrations',
          id: existingMigration.id,
          data: {
            ran: true,
          },
        });
      }
    } else {
      payload.logger.info({ msg: `${migration.name} already has already ran.` });
    }
  }
}
