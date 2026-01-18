import mongoose from 'mongoose';
import { createDatabaseAdapter, defaultBeginTransaction, findMigrationDir } from 'payload';
import { connect } from './connect.js';
import { count } from './count.js';
import { countGlobalVersions } from './countGlobalVersions.js';
import { countVersions } from './countVersions.js';
import { create } from './create.js';
import { createGlobal } from './createGlobal.js';
import { createGlobalVersion } from './createGlobalVersion.js';
import { createMigration } from './createMigration.js';
import { createVersion } from './createVersion.js';
import { deleteMany } from './deleteMany.js';
import { deleteOne } from './deleteOne.js';
import { deleteVersions } from './deleteVersions.js';
import { destroy } from './destroy.js';
import { find } from './find.js';
import { findDistinct } from './findDistinct.js';
import { findGlobal } from './findGlobal.js';
import { findGlobalVersions } from './findGlobalVersions.js';
import { findOne } from './findOne.js';
import { findVersions } from './findVersions.js';
import { init } from './init.js';
import { migrateFresh } from './migrateFresh.js';
import { queryDrafts } from './queryDrafts.js';
import { beginTransaction } from './transactions/beginTransaction.js';
import { commitTransaction } from './transactions/commitTransaction.js';
import { rollbackTransaction } from './transactions/rollbackTransaction.js';
import { updateGlobal } from './updateGlobal.js';
import { updateGlobalVersion } from './updateGlobalVersion.js';
import { updateJobs } from './updateJobs.js';
import { updateMany } from './updateMany.js';
import { updateOne } from './updateOne.js';
import { updateVersion } from './updateVersion.js';
import { upsert } from './upsert.js';
export function mongooseAdapter({ afterCreateConnection, afterOpenConnection, allowAdditionalKeys = false, allowIDOnCreate = false, autoPluralization = true, bulkOperationsSingleTransaction = false, collation, collectionsSchemaOptions = {}, connectOptions, disableFallbackSort = false, disableIndexHints = false, ensureIndexes = false, migrationDir: migrationDirArg, mongoMemoryServer, prodMigrations, transactionOptions = {}, url, useAlternativeDropDatabase = false, useBigIntForNumberIDs = false, useJoinAggregations = true, usePipelineInSortLookup = true }) {
    function adapter({ payload }) {
        const migrationDir = findMigrationDir(migrationDirArg);
        mongoose.set('strictQuery', false);
        return createDatabaseAdapter({
            name: 'mongoose',
            // Mongoose-specific
            afterCreateConnection,
            afterOpenConnection,
            autoPluralization,
            bulkOperationsSingleTransaction,
            collation,
            collections: {},
            // @ts-expect-error initialize without a connection
            connection: undefined,
            connectOptions: connectOptions || {},
            disableIndexHints,
            ensureIndexes,
            // @ts-expect-error don't have globals model yet
            globals: undefined,
            // @ts-expect-error Should not be required
            mongoMemoryServer,
            sessions: {},
            transactionOptions: transactionOptions === false ? undefined : transactionOptions,
            updateJobs,
            updateMany,
            url,
            versions: {},
            // DatabaseAdapter
            allowAdditionalKeys,
            allowIDOnCreate,
            beginTransaction: transactionOptions === false ? defaultBeginTransaction() : beginTransaction,
            collectionsSchemaOptions,
            commitTransaction,
            connect,
            count,
            countGlobalVersions,
            countVersions,
            create,
            createGlobal,
            createGlobalVersion,
            createMigration,
            createVersion,
            defaultIDType: 'text',
            deleteMany,
            deleteOne,
            deleteVersions,
            destroy,
            disableFallbackSort,
            find,
            findDistinct,
            findGlobal,
            findGlobalVersions,
            findOne,
            findVersions,
            init,
            migrateFresh,
            migrationDir,
            packageName: '@payloadcms/db-mongodb',
            payload,
            prodMigrations,
            queryDrafts,
            rollbackTransaction,
            updateGlobal,
            updateGlobalVersion,
            updateOne,
            updateVersion,
            upsert,
            useAlternativeDropDatabase,
            useBigIntForNumberIDs,
            useJoinAggregations,
            usePipelineInSortLookup
        });
    }
    return {
        name: 'mongoose',
        allowIDOnCreate,
        defaultIDType: 'text',
        init: adapter
    };
}
export { compatibilityOptions } from './utilities/compatibilityOptions.js';

//# sourceMappingURL=index.js.map