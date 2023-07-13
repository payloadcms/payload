import { transaction } from './transaction';
import { migrate } from './migrations/migrate';
import { migrateStatus } from './migrations/migrateStatus';
import { migrateDown } from './migrations/migrateDown';
import { migrateRefresh } from './migrations/migrateRefresh';
import { migrateReset } from './migrations/migrateReset';
import { DatabaseAdapter } from './types';
import type { Payload } from '../index';
import { createMigration } from './migrations/createMigration';


type BaseDatabaseAdapter = Pick<DatabaseAdapter, 'payload'
  | 'transaction'
  | 'migrate'
  | 'createMigration'
  | 'migrateStatus'
  | 'migrateDown'
  | 'migrateRefresh'
  | 'migrateReset'
  | 'migrateFresh'
  | 'migrationDir'
  >

type Args = {
  payload: Payload,
  migrationDir: string,
}
export function baseDatabaseAdapter({
  payload,
  migrationDir = '.migrations',
}: Args): BaseDatabaseAdapter {
  return {
    payload,
    transaction,
    migrate,
    createMigration,
    migrateStatus,
    migrateDown,
    migrateRefresh,
    migrateReset,
    migrateFresh: async () => null,
    migrationDir,
  };
}
