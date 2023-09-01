/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { PayloadRequest } from '../../express/types';
import type { DatabaseAdapter } from '../types';

import { getMigrations } from './getMigrations';
import { readMigrationFiles } from './readMigrationFiles';

export async function migrate(this: DatabaseAdapter): Promise<void> {
  const { payload } = this;
  const migrationFiles = await readMigrationFiles({ payload });
  const { existingMigrations, latestBatch } = await getMigrations({ payload });

  const newBatch = latestBatch + 1;

  // Execute 'up' function for each migration sequentially
  for (const migration of migrationFiles) {
    const existingMigration = existingMigrations.find((existing) => existing.name === migration.name);

    // Run migration if not found in database
    if (existingMigration) {
      continue; // eslint-disable-line no-continue
    }

    const start = Date.now();
    let transactionID: number | string | undefined;

    payload.logger.info({ msg: `Migrating: ${migration.name}` });

    try {
      transactionID = await this.beginTransaction();
      await migration.up({ payload });
      payload.logger.info({ msg: `Migrated:  ${migration.name} (${Date.now() - start}ms)` });
      await payload.create({
        collection: 'payload-migrations',
        data: {
          batch: newBatch,
          name: migration.name,
        },
        ...(transactionID && { req: { transactionID } as PayloadRequest }),
      });
      await this.commitTransaction(transactionID);
    } catch (err: unknown) {
      await this.rollbackTransaction(transactionID);
      payload.logger.error({ err, msg: `Error running migration ${migration.name}` });
      throw err;
    }
  }
}
