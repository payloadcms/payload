import type { ConnectOptions } from 'mongoose';
import type { DatabaseAdapter } from '../database/types';
import { Payload } from '../index';
import { connect } from './connect';
import { init } from './init';
import { webpack } from './webpack';
import { queryDrafts } from './queryDrafts';
import { GlobalModel } from '../globals/config/types';
import { find } from './find';
import { create } from './create';
import { updateOne } from './updateOne';
import { deleteOne } from './deleteOne';
import { findGlobal } from './findGlobal';
import { findOne } from './findOne';
import { findVersions } from './findVersions';
import { findGlobalVersions } from './findGlobalVersions';
import { deleteVersions } from './deleteVersions';
import { createVersion } from './createVersion';
import { updateVersion } from './updateVersion';
import { updateGlobal } from './updateGlobal';
import { createGlobal } from './createGlobal';
import { CollectionModel, TypeOfIndex } from './types';
import { SanitizedConfig } from '../config/types';

export type SanitizedPayloadMongooseConfig = Omit<
SanitizedConfig,
'db'
> & {
  db: MongooseAdapter;
}


export class PayloadMongoose extends Payload {
  db: MongooseAdapter;

  config: SanitizedPayloadMongooseConfig;
}


export interface Args {
  payload: PayloadMongoose,
  /** The URL to connect to MongoDB */
  url: string
  connectOptions?: ConnectOptions & {
    /** Set false to disable $facet aggregation in non-supporting databases, Defaults to true */
    useFacet?: boolean
  }
  collections?: {
    [slug: string]: {
      /**
       * Array of database indexes to create, including compound indexes that have multiple fields
       */
      indexes?: TypeOfIndex[]
    }
  },

}

export type MongooseAdapter = DatabaseAdapter &
  Args & {
    mongoMemoryServer: any
    collections: {
      [slug: string]: {
        model?: CollectionModel
        /**
         * Array of database indexes to create, including compound indexes that have multiple fields
         */
        indexes?: TypeOfIndex[];
      }
    }
    globals: GlobalModel
    versions: {
      [slug: string]: CollectionModel
    }
  }

export function mongooseAdapter({ payload, url, connectOptions, collections }: Args): MongooseAdapter {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return {
    payload,
    url,
    connectOptions: connectOptions || {},
    collections: collections ?? {},
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
    transaction: async () => true,
    beginTransaction: async () => true,
    rollbackTransaction: async () => true,
    commitTransaction: async () => true,
    queryDrafts,
    findOne,
    find,
    create,
    updateOne,
    deleteOne,
    findGlobal,
    createGlobal,
    updateGlobal,
    findVersions,
    findGlobalVersions,
    createVersion,
    updateVersion,
    deleteVersions,
  };
}
