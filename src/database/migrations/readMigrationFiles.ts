import fs from 'fs';
import { Migration } from '../types';
import { Payload } from '../../index';

/**
 * Read the migration files from disk
 */
export const readMigrationFiles = async ({ payload }: { payload: Payload }): Promise<Migration[]> => {
  const { config } = payload;
  const files = fs.readdirSync(config.db.migrationDir);
  return files.map((path) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(path);
  });
};
