import { beginTransaction, buildCreateMigration, commitTransaction, count, countGlobalVersions, countVersions, create, createGlobal, createGlobalVersion, createSchemaGenerator, createVersion, deleteMany, deleteOne, deleteVersions, destroy, find, findDistinct, findGlobal, findGlobalVersions, findOne, findVersions, migrate, migrateDown, migrateFresh, migrateRefresh, migrateReset, migrateStatus, operatorMap, queryDrafts, rollbackTransaction, updateGlobal, updateGlobalVersion, updateJobs, updateMany, updateOne, updateVersion, upsert } from '@payloadcms/drizzle';
import { columnToCodeConverter, convertPathToJSONTraversal, countDistinct, createJSONQuery, defaultDrizzleSnapshot, deleteWhere, dropDatabase, execute, init, insert, requireDrizzleKit } from '@payloadcms/drizzle/sqlite';
import { like, notLike } from 'drizzle-orm';
import { createDatabaseAdapter, defaultBeginTransaction, findMigrationDir } from 'payload';
import { fileURLToPath } from 'url';
import { connect } from './connect.js';
const filename = fileURLToPath(import.meta.url);
export function sqliteAdapter(args) {
    const sqliteIDType = args.idType || 'number';
    const payloadIDType = sqliteIDType === 'uuid' ? 'text' : 'number';
    const allowIDOnCreate = args.allowIDOnCreate ?? false;
    function adapter({ payload }) {
        const migrationDir = findMigrationDir(args.migrationDir);
        let resolveInitializing = ()=>{};
        let rejectInitializing = ()=>{};
        const initializing = new Promise((res, rej)=>{
            resolveInitializing = res;
            rejectInitializing = rej;
        });
        // sqlite's like operator is case-insensitive, so we overwrite the DrizzleAdapter operators to not use ilike
        const operators = {
            ...operatorMap,
            contains: like,
            like,
            not_like: notLike
        };
        return createDatabaseAdapter({
            name: 'sqlite',
            afterSchemaInit: args.afterSchemaInit ?? [],
            allowIDOnCreate,
            autoIncrement: args.autoIncrement ?? false,
            beforeSchemaInit: args.beforeSchemaInit ?? [],
            blocksAsJSON: args.blocksAsJSON ?? false,
            // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
            client: undefined,
            clientConfig: args.client,
            defaultDrizzleSnapshot,
            // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
            drizzle: undefined,
            features: {
                json: true
            },
            fieldConstraints: {},
            findDistinct,
            generateSchema: createSchemaGenerator({
                columnToCodeConverter,
                corePackageSuffix: 'sqlite-core',
                defaultOutputFile: args.generateSchemaOutputFile,
                tableImport: 'sqliteTable'
            }),
            idType: sqliteIDType,
            initializing,
            localesSuffix: args.localesSuffix || '_locales',
            logger: args.logger,
            operators,
            prodMigrations: args.prodMigrations,
            // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
            push: args.push,
            rawRelations: {},
            rawTables: {},
            relations: {},
            relationshipsSuffix: args.relationshipsSuffix || '_rels',
            schema: {},
            schemaName: args.schemaName,
            sessions: {},
            tableNameMap: new Map(),
            tables: {},
            // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
            transactionOptions: args.transactionOptions || undefined,
            updateJobs,
            updateMany,
            versionsSuffix: args.versionsSuffix || '_v',
            // DatabaseAdapter
            beginTransaction: args.transactionOptions ? beginTransaction : defaultBeginTransaction(),
            commitTransaction,
            connect,
            convertPathToJSONTraversal,
            count,
            countDistinct,
            countGlobalVersions,
            countVersions,
            create,
            createGlobal,
            createGlobalVersion,
            createJSONQuery,
            createMigration: buildCreateMigration({
                executeMethod: 'run',
                filename,
                sanitizeStatements ({ sqlExecute, statements }) {
                    return statements.map((statement)=>`${sqlExecute}${statement?.replaceAll('`', '\\`')}\`)`).join('\n');
                }
            }),
            createVersion,
            defaultIDType: payloadIDType,
            deleteMany,
            deleteOne,
            deleteVersions,
            deleteWhere,
            destroy,
            dropDatabase,
            execute,
            find,
            findGlobal,
            findGlobalVersions,
            findOne,
            findVersions,
            foreignKeys: new Set(),
            indexes: new Set(),
            init,
            insert,
            migrate,
            migrateDown,
            migrateFresh,
            migrateRefresh,
            migrateReset,
            migrateStatus,
            migrationDir,
            packageName: '@payloadcms/db-sqlite',
            payload,
            queryDrafts,
            rejectInitializing,
            requireDrizzleKit,
            resolveInitializing,
            rollbackTransaction,
            updateGlobal,
            updateGlobalVersion,
            updateOne,
            updateVersion,
            upsert
        });
    }
    return {
        name: 'sqlite',
        allowIDOnCreate,
        defaultIDType: payloadIDType,
        init: adapter
    };
}
export { sql } from 'drizzle-orm';

//# sourceMappingURL=index.js.map