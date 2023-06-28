import fs from 'fs';
import path from 'path';
import { Migration } from '../types';
import { Payload } from '../../index';

/**
 * Read the migration files from disk
 */
export const readMigrationFiles = async ({
  payload,
}: {
  payload: Payload;
}): Promise<Migration[]> => {
  const { config } = payload;
  const files = fs
    .readdirSync(config.db.migrationDir)
    .sort()
    .map((file) => {
      return path.resolve(config.db.migrationDir, file);
    });
  payload.logger.info({ files });
  return files.map((filePath) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires,import/no-dynamic-require
    return require(filePath);
  });
};
