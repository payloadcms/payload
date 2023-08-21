/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { DatabaseAdapter } from '../types';
import { getMigrations } from './getMigrations';
import { readMigrationFiles } from './readMigrationFiles';
import { PayloadRequest } from '../../express/types';

export async function migrateReset(this: DatabaseAdapter): Promise<void> {
  const { payload } = this;
  const migrationFiles = await readMigrationFiles({ payload });

  const { existingMigrations } = await getMigrations({ payload });

  if (!existingMigrations?.length) {
    payload.logger.info({ msg: 'No migrations to reset.' });
    return;
  }

  let transactionID;

  // Rollback all migrations in order
  for (const migration of migrationFiles) {
    // Create or update migration in database
    const existingMigration = existingMigrations.find((existing) => existing.name === migration.name);
    if (existingMigration) {
      payload.logger.info({ msg: `Migrating: ${migration.name}` });
      try {
        const start = Date.now();
        transactionID = await this.beginTransaction();
        await migration.down({ payload });
        await payload.delete({
          collection: 'payload-migrations',
          where: {
            id: {
              equals: existingMigration.id,
            },
          },
          req: { transactionID } as PayloadRequest,
        });
        await this.commitTransaction(transactionID);
        payload.logger.info({ msg: `Migrated:  ${migration.name} (${Date.now() - start}ms)` });
      } catch (err: unknown) {
        await this.rollbackTransaction(transactionID);
        payload.logger.error({ msg: `Error running migration ${migration.name}`, err });
        throw err;
      }
    }
  }
}
