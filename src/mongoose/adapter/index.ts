import type { ConnectOptions, Model } from 'mongoose';
import type { DatabaseAdapter } from '../../database/types';
import { connect } from './connect';
import { init } from './init';
import { webpack } from './webpack';
import { CollectionModel } from '../../collections/config/types';

export interface Args {
  /** The URL to connect to MongoDB */
  url: string
  connectOptions?: ConnectOptions & {
    /** Set false to disable $facet aggregation in non-supporting databases, Defaults to true */
    useFacet?: boolean
  }
}

export type MongooseAdapter = DatabaseAdapter &
  Args & {
    mongoMemoryServer: any
    collections: {
      [slug: string]: CollectionModel
    }
    globals: CollectionModel
    versions: {
      [slug: string]: CollectionModel
    }
  }

export function mongooseAdapter(adapterArgs: Args): MongooseAdapter {
  return {
    ...adapterArgs,
    connect,
    init,
    webpack,
    migrate: async () => null,
    migrateStatus: async () => null,
    migrateDown: async () => null,
    migrateRefresh: async () => null,
    migrateReset: async () => null,
    migrateFresh: async () => null,
    transaction: async () => true,
    beginTransaction: async () => true,
    rollbackTransaction: async () => true,
    commitTransaction: async () => true,
    queryDrafts: async () => true,
  };
}
