/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { DatabaseAdapter } from '../types';
import { getMigrations } from './getMigrations';
import { readMigrationFiles } from './readMigrationFiles';
import { PayloadRequest } from '../../express/types';

export async function migrateDown(this: DatabaseAdapter): Promise<void> {
  const { payload } = this;
  const migrationFiles = await readMigrationFiles({ payload });

  const {
    existingMigrations,
    latestBatch,
  } = await getMigrations({
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

    const start = Date.now();
    let transactionID;

    try {
      payload.logger.info({ msg: `Migrating: ${migrationFile.name}` });
      transactionID = await this.beginTransaction();
      await migrationFile.down({ payload });
      payload.logger.info({ msg: `Migrated:  ${migrationFile.name} (${Date.now() - start}ms)` });
      await payload.delete({
        collection: 'payload-migrations',
        id: migration.id,
        req: {
          transactionID,
        } as PayloadRequest,
      });
      await this.commitTransaction(transactionID);
    } catch (err: unknown) {
      await this.rollbackTransaction(transactionID);
      payload.logger.error({
        msg: `Error running migration ${migrationFile.name}`,
        err,
      });
      throw err;
    }
  }
}
