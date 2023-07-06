import type { ClientSession, Connection, ConnectOptions } from 'mongoose';
import type { DatabaseAdapter } from '../database/types';
import type { Payload } from '../index';
import { connect } from './connect';
import { init } from './init';
import { webpack } from './webpack';
import { transaction } from './transactions/transaction';
import { beginTransaction } from './transactions/beginTransaction';
import { rollbackTransaction } from './transactions/rollbackTransaction';
import { commitTransaction } from './transactions/commitTransaction';
import { CollectionModel } from '../collections/config/types';
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

export interface Args {
  payload: Payload,
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
    globals: GlobalModel
    versions: {
      [slug: string]: CollectionModel
    }
    session: ClientSession
    connection: Connection
  }

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
    transaction,
    beginTransaction,
    rollbackTransaction,
    commitTransaction,
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
