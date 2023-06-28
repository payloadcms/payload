import type { ConnectOptions } from 'mongoose';
import fs from 'fs';
import type { DatabaseAdapter } from '../database/types';
import { connect } from './connect';
import { init } from './init';
import { webpack } from './webpack';
import { CollectionModel } from '../collections/config/types';
import { queryDrafts } from './queryDrafts';
import { GlobalModel } from '../globals/config/types';
import { find } from './find';
import { create } from './create';
import { findVersions } from './findVersions';
import { findGlobalVersions } from './findGlobalVersions';
import type { Payload } from '../index';
import { slugify } from '../utilities/slugify';

export interface Args {
  payload: Payload;
  /** The URL to connect to MongoDB */
  url: string;
  connectOptions?: ConnectOptions & {
    /** Set false to disable $facet aggregation in non-supporting databases, Defaults to true */
    useFacet?: boolean;
  };
}

export type MongooseAdapter = DatabaseAdapter &
  Args & {
    mongoMemoryServer: any;
    collections: {
      [slug: string]: CollectionModel;
    };
    globals: GlobalModel;
    versions: {
      [slug: string]: CollectionModel;
    };
  };

const migrationTemplate = `
import payload, { Payload } from 'payload';

export async function up(payload: Payload): Promise<void> {
  // Migration code
};

export async function down(payload: Payload): Promise<void> {
  // Migration code
};
`;

export function mongooseAdapter({ payload, url, connectOptions }: Args): MongooseAdapter {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return {
    payload,
    url,
    connectOptions: connectOptions || {},
    collections: {},
    versions: {},
    connect,
    init,
    webpack,
    migrate: async () => null,
    migrateStatus: async () => null,
    migrateDown: async () => null,
    migrateRefresh: async () => null,
    migrateReset: async () => null,
    migrateFresh: async () => null,
    migrationDir: '.migrations',
    async createMigration(adapter, migrationName) {
      const migrationDir = adapter.migrationDir || '.migrations'; // TODO: Verify path after linking
      if (!fs.existsSync(migrationDir)) {
        fs.mkdirSync(migrationDir);
      }

      const timestamp = new Date().toISOString().split('.')[0].replace(/[^\d]/gi, '');
      const fileName = `${timestamp}-${slugify(migrationName)}.ts`;
      const filePath = `${migrationDir}/${fileName}`;
      fs.writeFileSync(filePath, migrationTemplate);
      payload.logger.info({ msg: `Migration created at ${filePath}` });
    },
    transaction: async () => true,
    beginTransaction: async () => true,
    rollbackTransaction: async () => true,
    commitTransaction: async () => true,
    queryDrafts,
    find,
    findVersions,
    findGlobalVersions,
    create,
  };
}
