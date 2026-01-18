import type { ExecutionResult, GraphQLSchema, ValidationRule } from 'graphql';
import type { Request as graphQLRequest, OperationArgs } from 'graphql-http';
import type { Logger } from 'pino';
import type { NonNever } from 'ts-essentials';
import type { AuthArgs } from './auth/operations/auth.js';
import type { Result as ForgotPasswordResult } from './auth/operations/forgotPassword.js';
import type { Result as LoginResult } from './auth/operations/login.js';
import type { Result as ResetPasswordResult } from './auth/operations/resetPassword.js';
import type { AuthStrategy, UntypedUser } from './auth/types.js';
import type { BulkOperationResult, Collection, DataFromCollectionSlug, SelectFromCollectionSlug, TypeWithID } from './collections/config/types.js';
import { type Options as ForgotPasswordOptions } from './auth/operations/local/forgotPassword.js';
import { type Options as LoginOptions } from './auth/operations/local/login.js';
import { type Options as ResetPasswordOptions } from './auth/operations/local/resetPassword.js';
import { type Options as UnlockOptions } from './auth/operations/local/unlock.js';
import { type Options as VerifyEmailOptions } from './auth/operations/local/verifyEmail.js';
export type { FieldState } from './admin/forms/Form.js';
import type { InitOptions, SanitizedConfig } from './config/types.js';
import type { BaseDatabaseAdapter, PaginatedDistinctDocs, PaginatedDocs } from './database/types.js';
import type { InitializedEmailAdapter } from './email/types.js';
import type { DataFromGlobalSlug, Globals, SelectFromGlobalSlug } from './globals/config/types.js';
import type { ApplyDisableErrors, DraftTransformCollectionWithSelect, JsonObject, SelectType, TransformCollectionWithSelect, TransformGlobalWithSelect } from './types/index.js';
import { type Options as CountOptions } from './collections/operations/local/count.js';
import { type Options as CreateOptions } from './collections/operations/local/create.js';
import { type ByIDOptions as DeleteByIDOptions, type ManyOptions as DeleteManyOptions } from './collections/operations/local/delete.js';
import { type Options as DuplicateOptions } from './collections/operations/local/duplicate.js';
import { type Options as FindOptions } from './collections/operations/local/find.js';
import { type Options as FindByIDOptions } from './collections/operations/local/findByID.js';
import { type Options as FindDistinctOptions } from './collections/operations/local/findDistinct.js';
import { type Options as FindVersionByIDOptions } from './collections/operations/local/findVersionByID.js';
import { type Options as FindVersionsOptions } from './collections/operations/local/findVersions.js';
import { type Options as RestoreVersionOptions } from './collections/operations/local/restoreVersion.js';
import { type ByIDOptions as UpdateByIDOptions, type ManyOptions as UpdateManyOptions } from './collections/operations/local/update.js';
import { type CountGlobalVersionsOptions } from './globals/operations/local/countVersions.js';
import { type Options as FindGlobalOptions } from './globals/operations/local/findOne.js';
import { type Options as FindGlobalVersionByIDOptions } from './globals/operations/local/findVersionByID.js';
import { type Options as FindGlobalVersionsOptions } from './globals/operations/local/findVersions.js';
import { type Options as RestoreGlobalVersionOptions } from './globals/operations/local/restoreVersion.js';
import { type Options as UpdateGlobalOptions } from './globals/operations/local/update.js';
export type * from './admin/types.js';
export { EntityType } from './admin/views/dashboard.js';
import { Cron } from 'croner';
import type { KVAdapter } from './kv/index.js';
import type { BaseJob } from './queues/config/types/workflowTypes.js';
import type { TypeWithVersion } from './versions/types.js';
import { decrypt, encrypt } from './auth/crypto.js';
import { type ImportMap } from './bin/generateImportMap/index.js';
import { type FlattenedBlock } from './fields/config/types.js';
/**
 * Export of all base fields that could potentially be
 * useful as users wish to extend built-in fields with custom logic
 */
export { accountLockFields as baseAccountLockFields } from './auth/baseFields/accountLock.js';
export { apiKeyFields as baseAPIKeyFields } from './auth/baseFields/apiKey.js';
export { baseAuthFields } from './auth/baseFields/auth.js';
export { emailFieldConfig as baseEmailField } from './auth/baseFields/email.js';
export { sessionsFieldConfig as baseSessionsField } from './auth/baseFields/sessions.js';
export { usernameFieldConfig as baseUsernameField } from './auth/baseFields/username.js';
export { verificationFields as baseVerificationFields } from './auth/baseFields/verification.js';
export { executeAccess } from './auth/executeAccess.js';
export { executeAuthStrategies } from './auth/executeAuthStrategies.js';
export { extractAccessFromPermission } from './auth/extractAccessFromPermission.js';
export { getAccessResults } from './auth/getAccessResults.js';
export { getFieldsToSign } from './auth/getFieldsToSign.js';
export { getLoginOptions } from './auth/getLoginOptions.js';
/**
 * Shape constraint for PayloadTypes.
 * Matches the structure of generated Config types.
 *
 * By defining the actual shape, we can use simple property access (T['collections'])
 * instead of conditional types throughout the codebase.
 */
export interface PayloadTypesShape {
    auth: Record<string, unknown>;
    blocks: Record<string, unknown>;
    collections: Record<string, unknown>;
    collectionsJoins: Record<string, unknown>;
    collectionsSelect: Record<string, unknown>;
    db: {
        defaultIDType: unknown;
    };
    fallbackLocale: unknown;
    globals: Record<string, unknown>;
    globalsSelect: Record<string, unknown>;
    jobs: unknown;
    locale: unknown;
    user: unknown;
}
/**
 * Untyped fallback types. Uses the SAME property names as generated types.
 * PayloadTypes merges GeneratedTypes with these fallbacks.
 */
export interface UntypedPayloadTypes {
    auth: {
        [slug: string]: {
            forgotPassword: {
                email: string;
            };
            login: {
                email: string;
                password: string;
            };
            registerFirstUser: {
                email: string;
                password: string;
            };
            unlock: {
                email: string;
            };
        };
    };
    blocks: {
        [slug: string]: JsonObject;
    };
    collections: {
        [slug: string]: JsonObject & TypeWithID;
    };
    collectionsJoins: {
        [slug: string]: {
            [schemaPath: string]: string;
        };
    };
    collectionsSelect: {
        [slug: string]: SelectType;
    };
    db: {
        defaultIDType: number | string;
    };
    fallbackLocale: 'false' | 'none' | 'null' | ({} & string)[] | ({} & string) | false | null;
    globals: {
        [slug: string]: JsonObject;
    };
    globalsSelect: {
        [slug: string]: SelectType;
    };
    jobs: {
        tasks: {
            [slug: string]: {
                input?: JsonObject;
                output?: JsonObject;
            };
        };
        workflows: {
            [slug: string]: {
                input: JsonObject;
            };
        };
    };
    locale: null | string;
    user: UntypedUser;
}
/**
 * Interface to be module-augmented by the `payload-types.ts` file.
 * When augmented, its properties take precedence over UntypedPayloadTypes.
 */
export interface GeneratedTypes {
}
/**
 * Check if GeneratedTypes has been augmented (has any keys).
 */
type IsAugmented = keyof GeneratedTypes extends never ? false : true;
/**
 * PayloadTypes merges GeneratedTypes with UntypedPayloadTypes.
 * - When augmented: uses augmented properties, fills gaps with untyped fallbacks
 * - When not augmented: uses only UntypedPayloadTypes
 */
export type PayloadTypes = IsAugmented extends true ? GeneratedTypes & Omit<UntypedPayloadTypes, keyof GeneratedTypes> : UntypedPayloadTypes;
export type TypedCollection<T extends PayloadTypesShape = PayloadTypes> = T['collections'];
export type TypedBlock = PayloadTypes['blocks'];
export type TypedUploadCollection<T extends PayloadTypesShape = PayloadTypes> = NonNever<{
    [TSlug in keyof T['collections']]: 'filename' | 'filesize' | 'mimeType' | 'url' extends keyof T['collections'][TSlug] ? T['collections'][TSlug] : never;
}>;
export type TypedCollectionSelect<T extends PayloadTypesShape = PayloadTypes> = T['collectionsSelect'];
export type TypedCollectionJoins<T extends PayloadTypesShape = PayloadTypes> = T['collectionsJoins'];
export type TypedGlobal<T extends PayloadTypesShape = PayloadTypes> = T['globals'];
export type TypedGlobalSelect<T extends PayloadTypesShape = PayloadTypes> = T['globalsSelect'];
export type StringKeyOf<T> = Extract<keyof T, string>;
export type CollectionSlug<T extends PayloadTypesShape = PayloadTypes> = StringKeyOf<T['collections']>;
export type BlockSlug = StringKeyOf<TypedBlock>;
export type UploadCollectionSlug<T extends PayloadTypesShape = PayloadTypes> = StringKeyOf<TypedUploadCollection<T>>;
export type DefaultDocumentIDType = PayloadTypes['db']['defaultIDType'];
export type GlobalSlug<T extends PayloadTypesShape = PayloadTypes> = StringKeyOf<T['globals']>;
export type TypedLocale<T extends PayloadTypesShape = PayloadTypes> = T['locale'];
export type TypedFallbackLocale = PayloadTypes['fallbackLocale'];
/**
 * @todo rename to `User` in 4.0
 */
export type TypedUser = PayloadTypes['user'];
export type TypedAuthOperations<T extends PayloadTypesShape = PayloadTypes> = T['auth'];
export type AuthCollectionSlug<T extends PayloadTypesShape> = StringKeyOf<T['auth']>;
export type TypedJobs = PayloadTypes['jobs'];
type HasPayloadJobsType = GeneratedTypes extends {
    collections: infer C;
} ? 'payload-jobs' extends keyof C ? true : false : false;
/**
 * Represents a job in the `payload-jobs` collection, referencing a queued workflow or task (= Job).
 * If a generated type for the `payload-jobs` collection is not available, falls back to the BaseJob type.
 *
 * `input` and `taksStatus` are always present here, as the job afterRead hook will always populate them.
 */
export type Job<TWorkflowSlugOrInput extends false | keyof TypedJobs['workflows'] | object = false> = HasPayloadJobsType extends true ? {
    input: BaseJob<TWorkflowSlugOrInput>['input'];
    taskStatus: BaseJob<TWorkflowSlugOrInput>['taskStatus'];
} & Omit<TypedCollection['payload-jobs'], 'input' | 'taskStatus'> : BaseJob<TWorkflowSlugOrInput>;
/**
 * @description Payload
 */
export declare class BasePayload {
    /**
     * @description Authorization and Authentication using headers and cookies to run auth user strategies
     * @returns permissions: Permissions
     * @returns user: User
     */
    auth: (options: AuthArgs) => Promise<import("./auth/operations/auth.js").AuthResult>;
    authStrategies: AuthStrategy[];
    blocks: Record<BlockSlug, FlattenedBlock>;
    collections: Record<CollectionSlug, Collection>;
    config: SanitizedConfig;
    /**
     * @description Performs count operation
     * @param options
     * @returns count of documents satisfying query
     */
    count: <T extends CollectionSlug>(options: CountOptions<T>) => Promise<{
        totalDocs: number;
    }>;
    /**
     * @description Performs countGlobalVersions operation
     * @param options
     * @returns count of global document versions satisfying query
     */
    countGlobalVersions: <T extends GlobalSlug>(options: CountGlobalVersionsOptions<T>) => Promise<{
        totalDocs: number;
    }>;
    /**
     * @description Performs countVersions operation
     * @param options
     * @returns count of document versions satisfying query
     */
    countVersions: <T extends CollectionSlug>(options: CountOptions<T>) => Promise<{
        totalDocs: number;
    }>;
    /**
     * @description Performs create operation
     * @param options
     * @returns created document
     */
    create: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(options: CreateOptions<TSlug, TSelect>) => Promise<TransformCollectionWithSelect<TSlug, TSelect>>;
    crons: Cron[];
    db: DatabaseAdapter;
    decrypt: typeof decrypt;
    destroy: () => Promise<void>;
    duplicate: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(options: DuplicateOptions<TSlug, TSelect>) => Promise<TransformCollectionWithSelect<TSlug, TSelect>>;
    email: InitializedEmailAdapter;
    encrypt: typeof encrypt;
    extensions: (args: {
        args: OperationArgs<any>;
        req: graphQLRequest<unknown, unknown>;
        result: ExecutionResult;
    }) => Promise<any>;
    /**
     * @description Find documents with criteria
     * @param options
     * @returns documents satisfying query
     */
    find: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>, TDraft extends boolean = false>(options: {
        draft?: TDraft;
    } & FindOptions<TSlug, TSelect>) => Promise<PaginatedDocs<TDraft extends true ? PayloadTypes extends {
        strictDraftTypes: true;
    } ? DraftTransformCollectionWithSelect<TSlug, TSelect> : TransformCollectionWithSelect<TSlug, TSelect> : TransformCollectionWithSelect<TSlug, TSelect>>>;
    /**
     * @description Find document by ID
     * @param options
     * @returns document with specified ID
     */
    findByID: <TSlug extends CollectionSlug, TDisableErrors extends boolean, TSelect extends SelectFromCollectionSlug<TSlug>>(options: FindByIDOptions<TSlug, TDisableErrors, TSelect>) => Promise<ApplyDisableErrors<TransformCollectionWithSelect<TSlug, TSelect>, TDisableErrors>>;
    /**
     * @description Find distinct field values
     * @param options
     * @returns result with distinct field values
     */
    findDistinct: <TSlug extends CollectionSlug, TField extends keyof DataFromCollectionSlug<TSlug> & string>(options: FindDistinctOptions<TSlug, TField>) => Promise<PaginatedDistinctDocs<Record<TField, DataFromCollectionSlug<TSlug>[TField]>>>;
    findGlobal: <TSlug extends GlobalSlug, TSelect extends SelectFromGlobalSlug<TSlug>>(options: FindGlobalOptions<TSlug, TSelect>) => Promise<TransformGlobalWithSelect<TSlug, TSelect>>;
    /**
     * @description Find global version by ID
     * @param options
     * @returns global version with specified ID
     */
    findGlobalVersionByID: <TSlug extends GlobalSlug>(options: FindGlobalVersionByIDOptions<TSlug>) => Promise<TypeWithVersion<DataFromGlobalSlug<TSlug>>>;
    /**
     * @description Find global versions with criteria
     * @param options
     * @returns versions satisfying query
     */
    findGlobalVersions: <TSlug extends GlobalSlug>(options: FindGlobalVersionsOptions<TSlug>) => Promise<PaginatedDocs<TypeWithVersion<DataFromGlobalSlug<TSlug>>>>;
    /**
     * @description Find version by ID
     * @param options
     * @returns version with specified ID
     */
    findVersionByID: <TSlug extends CollectionSlug>(options: FindVersionByIDOptions<TSlug>) => Promise<TypeWithVersion<DataFromCollectionSlug<TSlug>>>;
    /**
     * @description Find versions with criteria
     * @param options
     * @returns versions satisfying query
     */
    findVersions: <TSlug extends CollectionSlug>(options: FindVersionsOptions<TSlug>) => Promise<PaginatedDocs<TypeWithVersion<DataFromCollectionSlug<TSlug>>>>;
    forgotPassword: <TSlug extends CollectionSlug>(options: ForgotPasswordOptions<TSlug>) => Promise<ForgotPasswordResult>;
    getAdminURL: () => string;
    getAPIURL: () => string;
    globals: Globals;
    importMap: ImportMap;
    jobs: {
        handleSchedules: (args?: {
            allQueues?: boolean;
            queue?: string;
            req?: import("./types/index.js").PayloadRequest;
        }) => Promise<import("./queues/operations/handleSchedules/index.js").HandleSchedulesResult>;
        queue: <TTaskOrWorkflowSlug extends keyof TypedJobs["tasks"] | keyof TypedJobs["workflows"]>(args: {
            input: TypedJobs["tasks"][TTaskOrWorkflowSlug]["input"];
            meta?: BaseJob["meta"];
            overrideAccess?: boolean;
            queue?: string;
            req?: import("./types/index.js").PayloadRequest;
            task: TTaskOrWorkflowSlug extends keyof TypedJobs["tasks"] ? TTaskOrWorkflowSlug : never;
            waitUntil?: Date;
            workflow?: never;
        } | {
            input: TypedJobs["workflows"][TTaskOrWorkflowSlug]["input"];
            meta?: BaseJob["meta"];
            overrideAccess?: boolean;
            queue?: string;
            req?: import("./types/index.js").PayloadRequest;
            task?: never;
            waitUntil?: Date;
            workflow: TTaskOrWorkflowSlug extends keyof TypedJobs["workflows"] ? TTaskOrWorkflowSlug : never;
        }) => Promise<TTaskOrWorkflowSlug extends keyof TypedJobs["workflows"] ? Job<TTaskOrWorkflowSlug> : import("./queues/config/types/workflowTypes.js").RunningJobFromTask<TTaskOrWorkflowSlug>>;
        run: (args?: {
            allQueues?: boolean;
            limit?: number;
            overrideAccess?: boolean;
            processingOrder?: import("./types/index.js").Sort;
            queue?: string;
            req?: import("./types/index.js").PayloadRequest;
            sequential?: boolean;
            silent?: import("./queues/localAPI.js").RunJobsSilent;
            where?: import("./types/index.js").Where;
        }) => Promise<ReturnType<typeof import("./queues/operations/runJobs/index.js").runJobs>>;
        runByID: (args: {
            id: number | string;
            overrideAccess?: boolean;
            req?: import("./types/index.js").PayloadRequest;
            silent?: import("./queues/localAPI.js").RunJobsSilent;
        }) => Promise<ReturnType<typeof import("./queues/operations/runJobs/index.js").runJobs>>;
        cancel: (args: {
            overrideAccess?: boolean;
            queue?: string;
            req?: import("./types/index.js").PayloadRequest;
            where: import("./types/index.js").Where;
        }) => Promise<void>;
        cancelByID: (args: {
            id: number | string;
            overrideAccess?: boolean;
            req?: import("./types/index.js").PayloadRequest;
        }) => Promise<void>;
    };
    /**
     * Key Value storage
     */
    kv: KVAdapter;
    logger: Logger;
    login: <TSlug extends CollectionSlug>(options: LoginOptions<TSlug>) => Promise<{
        user: DataFromCollectionSlug<TSlug>;
    } & LoginResult>;
    resetPassword: <TSlug extends CollectionSlug>(options: ResetPasswordOptions<TSlug>) => Promise<ResetPasswordResult>;
    /**
     * @description Restore global version by ID
     * @param options
     * @returns version with specified ID
     */
    restoreGlobalVersion: <TSlug extends GlobalSlug>(options: RestoreGlobalVersionOptions<TSlug>) => Promise<DataFromGlobalSlug<TSlug>>;
    /**
     * @description Restore version by ID
     * @param options
     * @returns version with specified ID
     */
    restoreVersion: <TSlug extends CollectionSlug>(options: RestoreVersionOptions<TSlug>) => Promise<DataFromCollectionSlug<TSlug>>;
    schema: GraphQLSchema;
    secret: string;
    sendEmail: InitializedEmailAdapter['sendEmail'];
    types: {
        arrayTypes: any;
        blockInputTypes: any;
        blockTypes: any;
        fallbackLocaleInputType?: any;
        groupTypes: any;
        localeInputType?: any;
        tabTypes: any;
    };
    unlock: <TSlug extends CollectionSlug>(options: UnlockOptions<TSlug>) => Promise<boolean>;
    updateGlobal: <TSlug extends GlobalSlug, TSelect extends SelectFromGlobalSlug<TSlug>>(options: UpdateGlobalOptions<TSlug, TSelect>) => Promise<TransformGlobalWithSelect<TSlug, TSelect>>;
    validationRules: (args: OperationArgs<any>) => ValidationRule[];
    verifyEmail: <TSlug extends CollectionSlug>(options: VerifyEmailOptions<TSlug>) => Promise<boolean>;
    versions: {
        [slug: string]: any;
    };
    _initializeCrons(): Promise<void>;
    bin({ args, cwd, log, }: {
        args: string[];
        cwd?: string;
        log?: boolean;
    }): Promise<{
        code: number;
    }>;
    /**
     * @description delete one or more documents
     * @param options
     * @returns Updated document(s)
     */
    delete<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(options: DeleteByIDOptions<TSlug, TSelect>): Promise<TransformCollectionWithSelect<TSlug, TSelect>>;
    delete<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(options: DeleteManyOptions<TSlug, TSelect>): Promise<BulkOperationResult<TSlug, TSelect>>;
    /**
     * @description Initializes Payload
     * @param options
     */
    init(options: InitOptions): Promise<Payload>;
    update<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(options: UpdateManyOptions<TSlug, TSelect>): Promise<BulkOperationResult<TSlug, TSelect>>;
    /**
     * @description Update one or more documents
     * @param options
     * @returns Updated document(s)
     */
    update<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(options: UpdateByIDOptions<TSlug, TSelect>): Promise<TransformCollectionWithSelect<TSlug, TSelect>>;
}
declare const initialized: BasePayload;
export default initialized;
export declare const reload: (config: SanitizedConfig, payload: Payload, skipImportMapGeneration?: boolean, options?: InitOptions) => Promise<void>;
/**
 * Get a payload instance.
 * This function is a wrapper around new BasePayload().init() that adds the following functionality on top of that:
 *
 * - smartly caches Payload instance on the module scope. That way, we prevent unnecessarily initializing Payload over and over again
 * when calling getPayload multiple times or from multiple locations.
 * - adds HMR support and reloads the payload instance when the config changes.
 */
export declare const getPayload: (options: {
    /**
     * A unique key to identify the payload instance. You can pass your own key if you want to cache this payload instance separately.
     * This is useful if you pass a different payload config for each instance.
     *
     * @default 'default'
     */
    key?: string;
} & InitOptions) => Promise<Payload>;
type Payload = BasePayload;
interface RequestContext {
    [key: string]: unknown;
}
export interface DatabaseAdapter extends BaseDatabaseAdapter {
}
export type { Payload, RequestContext };
export * from './auth/index.js';
export { jwtSign } from './auth/jwt.js';
export { accessOperation } from './auth/operations/access.js';
export { forgotPasswordOperation } from './auth/operations/forgotPassword.js';
export { initOperation } from './auth/operations/init.js';
export { checkLoginPermission } from './auth/operations/login.js';
export { loginOperation } from './auth/operations/login.js';
export { logoutOperation } from './auth/operations/logout.js';
export type { MeOperationResult } from './auth/operations/me.js';
export { meOperation } from './auth/operations/me.js';
export { refreshOperation } from './auth/operations/refresh.js';
export { registerFirstUserOperation } from './auth/operations/registerFirstUser.js';
export { resetPasswordOperation } from './auth/operations/resetPassword.js';
export { unlockOperation } from './auth/operations/unlock.js';
export { verifyEmailOperation } from './auth/operations/verifyEmail.js';
export { JWTAuthentication } from './auth/strategies/jwt.js';
export { incrementLoginAttempts } from './auth/strategies/local/incrementLoginAttempts.js';
export { resetLoginAttempts } from './auth/strategies/local/resetLoginAttempts.js';
export type { AuthStrategyFunction, AuthStrategyFunctionArgs, AuthStrategyResult, CollectionPermission, DocumentPermissions, FieldPermissions, GlobalPermission, IncomingAuthType, Permission, Permissions, SanitizedCollectionPermission, SanitizedDocumentPermissions, SanitizedFieldPermissions, SanitizedGlobalPermission, SanitizedPermissions, UntypedUser as User, VerifyConfig, } from './auth/types.js';
export { generateImportMap } from './bin/generateImportMap/index.js';
export type { ImportMap } from './bin/generateImportMap/index.js';
export { genImportMapIterateFields } from './bin/generateImportMap/iterateFields.js';
export { migrate as migrateCLI } from './bin/migrate.js';
export { type ClientCollectionConfig, createClientCollectionConfig, createClientCollectionConfigs, type ServerOnlyCollectionAdminProperties, type ServerOnlyCollectionProperties, type ServerOnlyUploadProperties, } from './collections/config/client.js';
export type { AfterChangeHook as CollectionAfterChangeHook, AfterDeleteHook as CollectionAfterDeleteHook, AfterErrorHook as CollectionAfterErrorHook, AfterForgotPasswordHook as CollectionAfterForgotPasswordHook, AfterLoginHook as CollectionAfterLoginHook, AfterLogoutHook as CollectionAfterLogoutHook, AfterMeHook as CollectionAfterMeHook, AfterOperationHook as CollectionAfterOperationHook, AfterReadHook as CollectionAfterReadHook, AfterRefreshHook as CollectionAfterRefreshHook, AuthCollection, AuthOperationsFromCollectionSlug, BaseFilter, BaseListFilter, BeforeChangeHook as CollectionBeforeChangeHook, BeforeDeleteHook as CollectionBeforeDeleteHook, BeforeLoginHook as CollectionBeforeLoginHook, BeforeOperationHook as CollectionBeforeOperationHook, BeforeReadHook as CollectionBeforeReadHook, BeforeValidateHook as CollectionBeforeValidateHook, BulkOperationResult, Collection, CollectionAdminOptions, CollectionConfig, DataFromCollectionSlug, HookOperationType, MeHook as CollectionMeHook, RefreshHook as CollectionRefreshHook, RequiredDataFromCollection, RequiredDataFromCollectionSlug, SanitizedCollectionConfig, SanitizedJoins, TypeWithID, TypeWithTimestamps, } from './collections/config/types.js';
export type { CompoundIndex } from './collections/config/types.js';
export type { SanitizedCompoundIndex } from './collections/config/types.js';
export { createDataloaderCacheKey, getDataLoader } from './collections/dataloader.js';
export { countOperation } from './collections/operations/count.js';
export { createOperation } from './collections/operations/create.js';
export { deleteOperation } from './collections/operations/delete.js';
export { deleteByIDOperation } from './collections/operations/deleteByID.js';
export { docAccessOperation } from './collections/operations/docAccess.js';
export { duplicateOperation } from './collections/operations/duplicate.js';
export { findOperation } from './collections/operations/find.js';
export { findByIDOperation } from './collections/operations/findByID.js';
export { findVersionByIDOperation } from './collections/operations/findVersionByID.js';
export { findVersionsOperation } from './collections/operations/findVersions.js';
export { restoreVersionOperation } from './collections/operations/restoreVersion.js';
export { updateOperation } from './collections/operations/update.js';
export { updateByIDOperation } from './collections/operations/updateByID.js';
export { buildConfig } from './config/build.js';
export { type ClientConfig, createClientConfig, type CreateClientConfigArgs, createUnauthenticatedClientConfig, serverOnlyAdminConfigProperties, serverOnlyConfigProperties, type UnauthenticatedClientConfig, } from './config/client.js';
export { defaults } from './config/defaults.js';
export { type OrderableEndpointBody } from './config/orderable/index.js';
export { sanitizeConfig } from './config/sanitize.js';
export type * from './config/types.js';
export { combineQueries } from './database/combineQueries.js';
export { createDatabaseAdapter } from './database/createDatabaseAdapter.js';
export { defaultBeginTransaction } from './database/defaultBeginTransaction.js';
export { flattenWhereToOperators } from './database/flattenWhereToOperators.js';
export { getLocalizedPaths } from './database/getLocalizedPaths.js';
export { createMigration } from './database/migrations/createMigration.js';
export { findMigrationDir } from './database/migrations/findMigrationDir.js';
export { getMigrations } from './database/migrations/getMigrations.js';
export { getPredefinedMigration } from './database/migrations/getPredefinedMigration.js';
export { migrate } from './database/migrations/migrate.js';
export { migrateDown } from './database/migrations/migrateDown.js';
export { migrateRefresh } from './database/migrations/migrateRefresh.js';
export { migrateReset } from './database/migrations/migrateReset.js';
export { migrateStatus } from './database/migrations/migrateStatus.js';
export { migrationsCollection } from './database/migrations/migrationsCollection.js';
export { migrationTemplate } from './database/migrations/migrationTemplate.js';
export { readMigrationFiles } from './database/migrations/readMigrationFiles.js';
export { writeMigrationIndex } from './database/migrations/writeMigrationIndex.js';
export type * from './database/queryValidation/types.js';
export type { EntityPolicies, PathToQuery } from './database/queryValidation/types.js';
export { validateQueryPaths } from './database/queryValidation/validateQueryPaths.js';
export { validateSearchParam } from './database/queryValidation/validateSearchParams.js';
export type { BaseDatabaseAdapter, BeginTransaction, CommitTransaction, Connect, Count, CountArgs, CountGlobalVersionArgs, CountGlobalVersions, CountVersions, Create, CreateArgs, CreateGlobal, CreateGlobalArgs, CreateGlobalVersion, CreateGlobalVersionArgs, CreateMigration, CreateVersion, CreateVersionArgs, DatabaseAdapterResult as DatabaseAdapterObj, DBIdentifierName, DeleteMany, DeleteManyArgs, DeleteOne, DeleteOneArgs, DeleteVersions, DeleteVersionsArgs, Destroy, Find, FindArgs, FindDistinct, FindGlobal, FindGlobalArgs, FindGlobalVersions, FindGlobalVersionsArgs, FindOne, FindOneArgs, FindVersions, FindVersionsArgs, GenerateSchema, Init, Migration, MigrationData, MigrationTemplateArgs, PaginatedDistinctDocs, PaginatedDocs, QueryDrafts, QueryDraftsArgs, RollbackTransaction, Transaction, UpdateGlobal, UpdateGlobalArgs, UpdateGlobalVersion, UpdateGlobalVersionArgs, UpdateJobs, UpdateJobsArgs, UpdateMany, UpdateManyArgs, UpdateOne, UpdateOneArgs, UpdateVersion, UpdateVersionArgs, Upsert, UpsertArgs, } from './database/types.js';
export type { EmailAdapter as PayloadEmailAdapter, SendEmailOptions } from './email/types.js';
export { APIError, APIErrorName, AuthenticationError, DuplicateCollection, DuplicateFieldName, DuplicateGlobal, ErrorDeletingFile, FileRetrievalError, FileUploadError, Forbidden, InvalidConfiguration, InvalidFieldName, InvalidFieldRelationship, Locked, LockedAuth, MissingCollectionLabel, MissingEditorProp, MissingFieldInputOptions, MissingFieldType, MissingFile, NotFound, QueryError, UnauthorizedError, UnverifiedEmail, ValidationError, ValidationErrorName, } from './errors/index.js';
export type { ValidationFieldError } from './errors/index.js';
export { baseBlockFields } from './fields/baseFields/baseBlockFields.js';
export { baseIDField } from './fields/baseFields/baseIDField.js';
export { slugField, type SlugFieldClientProps } from './fields/baseFields/slug/index.js';
export { type SlugField } from './fields/baseFields/slug/index.js';
export { createClientField, createClientFields, type ServerOnlyFieldAdminProperties, type ServerOnlyFieldProperties, } from './fields/config/client.js';
export { sanitizeFields } from './fields/config/sanitize.js';
export interface FieldCustom extends Record<string, any> {
}
export interface CollectionCustom extends Record<string, any> {
}
export interface CollectionAdminCustom extends Record<string, any> {
}
export interface GlobalCustom extends Record<string, any> {
}
export interface GlobalAdminCustom extends Record<string, any> {
}
export type { AdminClient, ArrayField, ArrayFieldClient, BaseValidateOptions, Block, BlockJSX, BlocksField, BlocksFieldClient, CheckboxField, CheckboxFieldClient, ClientBlock, ClientField, ClientFieldProps, CodeField, CodeFieldClient, CollapsibleField, CollapsibleFieldClient, Condition, DateField, DateFieldClient, EmailField, EmailFieldClient, Field, FieldAccess, FieldAffectingData, FieldAffectingDataClient, FieldBase, FieldBaseClient, FieldHook, FieldHookArgs, FieldPresentationalOnly, FieldPresentationalOnlyClient, FieldTypes, FieldWithMany, FieldWithManyClient, FieldWithMaxDepth, FieldWithMaxDepthClient, FieldWithPath, FieldWithPathClient, FieldWithSubFields, FieldWithSubFieldsClient, FilterOptions, FilterOptionsProps, FlattenedArrayField, FlattenedBlock, FlattenedBlocksField, FlattenedField, FlattenedGroupField, FlattenedJoinField, FlattenedTabAsField, GroupField, GroupFieldClient, HookName, JoinField, JoinFieldClient, JSONField, JSONFieldClient, Labels, LabelsClient, NamedGroupField, NamedGroupFieldClient, NamedTab, NonPresentationalField, NonPresentationalFieldClient, NumberField, NumberFieldClient, Option, OptionLabel, OptionObject, PointField, PointFieldClient, PolymorphicRelationshipField, PolymorphicRelationshipFieldClient, RadioField, RadioFieldClient, RelationshipField, RelationshipFieldClient, RelationshipValue, RichTextField, RichTextFieldClient, RowField, RowFieldClient, SelectField, SelectFieldClient, SingleRelationshipField, SingleRelationshipFieldClient, Tab, TabAsField, TabAsFieldClient, TabsField, TabsFieldClient, TextareaField, TextareaFieldClient, TextField, TextFieldClient, UIField, UIFieldClient, UnnamedGroupField, UnnamedGroupFieldClient, UnnamedTab, UploadField, UploadFieldClient, Validate, ValidateOptions, ValueWithRelation, } from './fields/config/types.js';
export { getDefaultValue } from './fields/getDefaultValue.js';
export { traverseFields as afterChangeTraverseFields } from './fields/hooks/afterChange/traverseFields.js';
export { promise as afterReadPromise } from './fields/hooks/afterRead/promise.js';
export { traverseFields as afterReadTraverseFields } from './fields/hooks/afterRead/traverseFields.js';
export { traverseFields as beforeChangeTraverseFields } from './fields/hooks/beforeChange/traverseFields.js';
export { traverseFields as beforeValidateTraverseFields } from './fields/hooks/beforeValidate/traverseFields.js';
export { sortableFieldTypes } from './fields/sortableFieldTypes.js';
export { validateBlocksFilterOptions, validations } from './fields/validations.js';
export type { ArrayFieldValidation, BlocksFieldValidation, CheckboxFieldValidation, CodeFieldValidation, ConfirmPasswordFieldValidation, DateFieldValidation, EmailFieldValidation, JSONFieldValidation, NumberFieldManyValidation, NumberFieldSingleValidation, NumberFieldValidation, PasswordFieldValidation, PointFieldValidation, RadioFieldValidation, RelationshipFieldManyValidation, RelationshipFieldSingleValidation, RelationshipFieldValidation, RichTextFieldValidation, SelectFieldManyValidation, SelectFieldSingleValidation, SelectFieldValidation, TextareaFieldValidation, TextFieldManyValidation, TextFieldSingleValidation, TextFieldValidation, UploadFieldManyValidation, UploadFieldSingleValidation, UploadFieldValidation, UsernameFieldValidation, } from './fields/validations.js';
export type { FolderSortKeys } from './folders/types.js';
export { getFolderData } from './folders/utils/getFolderData.js';
export { type ClientGlobalConfig, createClientGlobalConfig, createClientGlobalConfigs, type ServerOnlyGlobalAdminProperties, type ServerOnlyGlobalProperties, } from './globals/config/client.js';
export type { AfterChangeHook as GlobalAfterChangeHook, AfterReadHook as GlobalAfterReadHook, BeforeChangeHook as GlobalBeforeChangeHook, BeforeOperationHook as GlobalBeforeOperationHook, BeforeReadHook as GlobalBeforeReadHook, BeforeValidateHook as GlobalBeforeValidateHook, DataFromGlobalSlug, GlobalAdminOptions, GlobalConfig, SanitizedGlobalConfig, } from './globals/config/types.js';
export { docAccessOperation as docAccessOperationGlobal } from './globals/operations/docAccess.js';
export { findOneOperation } from './globals/operations/findOne.js';
export { findVersionByIDOperation as findVersionByIDOperationGlobal } from './globals/operations/findVersionByID.js';
export { findVersionsOperation as findVersionsOperationGlobal } from './globals/operations/findVersions.js';
export { restoreVersionOperation as restoreVersionOperationGlobal } from './globals/operations/restoreVersion.js';
export { updateOperation as updateOperationGlobal } from './globals/operations/update.js';
export * from './kv/adapters/DatabaseKVAdapter.js';
export * from './kv/adapters/InMemoryKVAdapter.js';
export * from './kv/index.js';
export type { CollapsedPreferences, CollectionPreferences, 
/**
 * @deprecated Use `CollectionPreferences` instead.
 */
CollectionPreferences as ListPreferences, ColumnPreference, DocumentPreferences, FieldsPreferences, InsideFieldsPreferences, PreferenceRequest, PreferenceUpdateRequest, TabsPreferences, } from './preferences/types.js';
export type { QueryPreset } from './query-presets/types.js';
export { jobAfterRead } from './queues/config/collection.js';
export type { JobsConfig, RunJobAccess, RunJobAccessArgs } from './queues/config/types/index.js';
export type { RunInlineTaskFunction, RunTaskFunction, RunTaskFunctions, TaskConfig, TaskHandler, TaskHandlerArgs, TaskHandlerResult, TaskHandlerResults, TaskInput, TaskOutput, TaskType, } from './queues/config/types/taskTypes.js';
export type { BaseJob, ConcurrencyConfig, JobLog, JobTaskStatus, RunningJob, SingleTaskStatus, WorkflowConfig, WorkflowHandler, WorkflowTypes, } from './queues/config/types/workflowTypes.js';
export { JobCancelledError } from './queues/errors/index.js';
export { countRunnableOrActiveJobsForQueue } from './queues/operations/handleSchedules/countRunnableOrActiveJobsForQueue.js';
export { importHandlerPath } from './queues/operations/runJobs/runJob/importHandlerPath.js';
export { _internal_jobSystemGlobals, _internal_resetJobSystemGlobals, getCurrentDate, } from './queues/utilities/getCurrentDate.js';
export { getLocalI18n } from './translations/getLocalI18n.js';
export * from './types/index.js';
export { getFileByPath } from './uploads/getFileByPath.js';
export { _internal_safeFetchGlobal } from './uploads/safeFetch.js';
export type * from './uploads/types.js';
export { addDataAndFileToRequest } from './utilities/addDataAndFileToRequest.js';
export { addLocalesToRequestFromData, sanitizeLocales } from './utilities/addLocalesToRequest.js';
export { canAccessAdmin } from './utilities/canAccessAdmin.js';
export { commitTransaction } from './utilities/commitTransaction.js';
export { configToJSONSchema, entityToJSONSchema, fieldsToJSONSchema, withNullableJSONSchemaType, } from './utilities/configToJSONSchema.js';
export { createArrayFromCommaDelineated } from './utilities/createArrayFromCommaDelineated.js';
export { createLocalReq } from './utilities/createLocalReq.js';
export { createPayloadRequest } from './utilities/createPayloadRequest.js';
export { deepCopyObject, deepCopyObjectComplex, deepCopyObjectSimple, } from './utilities/deepCopyObject.js';
export { deepMerge, deepMergeWithCombinedArrays, deepMergeWithReactComponents, deepMergeWithSourceArrays, } from './utilities/deepMerge.js';
export { checkDependencies, type CustomVersionParser, } from './utilities/dependencies/dependencyChecker.js';
export { getDependencies } from './utilities/dependencies/getDependencies.js';
export { findUp, findUpSync, pathExistsAndIsAccessible, pathExistsAndIsAccessibleSync, } from './utilities/findUp.js';
export { flattenAllFields } from './utilities/flattenAllFields.js';
export { flattenTopLevelFields } from './utilities/flattenTopLevelFields.js';
export { formatErrors } from './utilities/formatErrors.js';
export { formatLabels, formatNames, toWords } from './utilities/formatLabels.js';
export { getBlockSelect } from './utilities/getBlockSelect.js';
export { getCollectionIDFieldTypes } from './utilities/getCollectionIDFieldTypes.js';
export { getFieldByPath } from './utilities/getFieldByPath.js';
export { getObjectDotNotation } from './utilities/getObjectDotNotation.js';
export { getRequestLanguage } from './utilities/getRequestLanguage.js';
export { handleEndpoints } from './utilities/handleEndpoints.js';
export { headersWithCors } from './utilities/headersWithCors.js';
export { initTransaction } from './utilities/initTransaction.js';
export { isEntityHidden } from './utilities/isEntityHidden.js';
export { isolateObjectProperty } from './utilities/isolateObjectProperty.js';
export { isPlainObject } from './utilities/isPlainObject.js';
export { isValidID } from './utilities/isValidID.js';
export { killTransaction } from './utilities/killTransaction.js';
export { logError } from './utilities/logError.js';
export { defaultLoggerOptions } from './utilities/logger.js';
export { mapAsync } from './utilities/mapAsync.js';
export { mergeHeaders } from './utilities/mergeHeaders.js';
export { parseDocumentID } from './utilities/parseDocumentID.js';
export { sanitizeFallbackLocale } from './utilities/sanitizeFallbackLocale.js';
export { sanitizeJoinParams } from './utilities/sanitizeJoinParams.js';
export { sanitizePopulateParam } from './utilities/sanitizePopulateParam.js';
export { sanitizeSelectParam } from './utilities/sanitizeSelectParam.js';
export { stripUnselectedFields } from './utilities/stripUnselectedFields.js';
export { traverseFields } from './utilities/traverseFields.js';
export type { TraverseFieldsCallback } from './utilities/traverseFields.js';
export { buildVersionCollectionFields } from './versions/buildCollectionFields.js';
export { buildVersionGlobalFields } from './versions/buildGlobalFields.js';
export { buildVersionCompoundIndexes } from './versions/buildVersionCompoundIndexes.js';
export { versionDefaults } from './versions/defaults.js';
export { deleteCollectionVersions } from './versions/deleteCollectionVersions.js';
export { appendVersionToQueryKey } from './versions/drafts/appendVersionToQueryKey.js';
export { getQueryDraftsSort } from './versions/drafts/getQueryDraftsSort.js';
export { enforceMaxVersions } from './versions/enforceMaxVersions.js';
export { getLatestCollectionVersion } from './versions/getLatestCollectionVersion.js';
export { getLatestGlobalVersion } from './versions/getLatestGlobalVersion.js';
export { saveVersion } from './versions/saveVersion.js';
export type { SchedulePublishTaskInput } from './versions/schedule/types.js';
export type { SchedulePublish, TypeWithVersion } from './versions/types.js';
export { deepMergeSimple } from '@payloadcms/translations/utilities';
//# sourceMappingURL=index.d.ts.map