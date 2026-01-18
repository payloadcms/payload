import type { forgotPasswordOperation } from '../../../auth/operations/forgotPassword.js';
import type { loginOperation } from '../../../auth/operations/login.js';
import type { refreshOperation } from '../../../auth/operations/refresh.js';
import type { resetPasswordOperation } from '../../../auth/operations/resetPassword.js';
import type { unlockOperation } from '../../../auth/operations/unlock.js';
import type { CollectionSlug, RequestContext, restoreVersionOperation } from '../../../index.js';
import type { PayloadRequest } from '../../../types/index.js';
import type { SanitizedCollectionConfig, SelectFromCollectionSlug } from '../../config/types.js';
import type { countOperation } from '../count.js';
import type { countVersionsOperation } from '../countVersions.js';
import type { createOperation } from '../create.js';
import type { deleteOperation } from '../delete.js';
import type { deleteByIDOperation } from '../deleteByID.js';
import type { findOperation } from '../find.js';
import type { findByIDOperation } from '../findByID.js';
import type { findDistinctOperation } from '../findDistinct.js';
import type { findVersionByIDOperation } from '../findVersionByID.js';
import type { findVersionsOperation } from '../findVersions.js';
import type { updateOperation } from '../update.js';
import type { updateByIDOperation } from '../updateByID.js';
export type OperationMap<TOperationGeneric extends CollectionSlug> = {
    count: typeof countOperation<TOperationGeneric>;
    countVersions: typeof countVersionsOperation<TOperationGeneric>;
    create: typeof createOperation<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>;
    delete: typeof deleteOperation<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>;
    deleteByID: typeof deleteByIDOperation<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>;
    find: typeof findOperation<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>;
    findByID: typeof findByIDOperation<TOperationGeneric, boolean, SelectFromCollectionSlug<TOperationGeneric>>;
    findDistinct: typeof findDistinctOperation;
    findVersionByID: typeof findVersionByIDOperation;
    findVersions: typeof findVersionsOperation;
    forgotPassword: typeof forgotPasswordOperation;
    login: typeof loginOperation<TOperationGeneric>;
    refresh: typeof refreshOperation;
    resetPassword: typeof resetPasswordOperation<TOperationGeneric>;
    restoreVersion: typeof restoreVersionOperation;
    unlock: typeof unlockOperation<TOperationGeneric>;
    update: typeof updateOperation<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>;
    updateByID: typeof updateByIDOperation<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>;
};
export type AfterOperationArg<TOperationGeneric extends CollectionSlug> = {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    req: PayloadRequest;
} & ({
    args: Parameters<OperationMap<TOperationGeneric>['count']>[0];
    operation: 'count';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['count']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['countVersions']>[0];
    operation: 'countVersions';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['countVersions']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['create']>[0];
    operation: 'create';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['create']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['delete']>[0];
    operation: 'delete';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['delete']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['deleteByID']>[0];
    operation: 'deleteByID';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['deleteByID']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['find']>[0];
    /**
     * @deprecated Use 'find' or 'findByID' operation instead
     *
     * TODO: v4 - remove this union option
     */
    operation: 'read';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['find']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['find']>[0];
    operation: 'find';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['find']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findByID']>[0];
    operation: 'findByID';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['findByID']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findDistinct']>[0];
    operation: 'findDistinct';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['findDistinct']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findVersionByID']>[0];
    operation: 'findVersionByID';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['findVersionByID']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findVersions']>[0];
    operation: 'findVersions';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['findVersions']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['forgotPassword']>[0];
    operation: 'forgotPassword';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['forgotPassword']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['login']>[0];
    operation: 'login';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['login']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['refresh']>[0];
    operation: 'refresh';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['refresh']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['resetPassword']>[0];
    operation: 'resetPassword';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['resetPassword']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['restoreVersion']>[0];
    operation: 'restoreVersion';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['restoreVersion']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['unlock']>[0];
    operation: 'unlock';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['unlock']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['update']>[0];
    operation: 'update';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['update']>>;
} | {
    args: Parameters<OperationMap<TOperationGeneric>['updateByID']>[0];
    operation: 'updateByID';
    result: Awaited<ReturnType<OperationMap<TOperationGeneric>['updateByID']>>;
});
export type OperationResult<TOperationGeneric extends CollectionSlug, O extends keyof OperationMap<TOperationGeneric>> = Awaited<ReturnType<OperationMap<TOperationGeneric>[O]>>;
export type OperationArgs<TOperationGeneric extends CollectionSlug, O extends keyof OperationMap<TOperationGeneric>> = Parameters<OperationMap<TOperationGeneric>[O]>[0];
export declare const operationToHookOperation: {
    readonly count: "count";
    readonly countVersions: "countVersions";
    readonly create: "create";
    readonly delete: "delete";
    readonly deleteByID: "delete";
    readonly find: "read";
    readonly findByID: "read";
    readonly findDistinct: "readDistinct";
    readonly findVersionByID: "read";
    readonly findVersions: "read";
    readonly forgotPassword: "forgotPassword";
    readonly login: "login";
    readonly read: "read";
    readonly readDistinct: "readDistinct";
    readonly refresh: "refresh";
    readonly resetPassword: "resetPassword";
    readonly restoreVersion: "restoreVersion";
    readonly unlock: "unlock";
    readonly update: "update";
    readonly updateByID: "update";
};
export type BeforeOperationArg<TOperationGeneric extends CollectionSlug> = {
    /** The collection which this hook is being run on */
    collection: SanitizedCollectionConfig;
    context: RequestContext;
    req: PayloadRequest;
} & ({
    args: Parameters<OperationMap<TOperationGeneric>['find']>[0] | Parameters<OperationMap<TOperationGeneric>['findByID']>[0];
    /**
     * @deprecated Use 'find' or 'findByID' operation instead
     *
     * TODO: v4 - remove this union option
     */
    operation: 'read';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['count']>[0];
    operation: 'count';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['countVersions']>[0];
    operation: 'countVersions';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['create']>[0];
    operation: 'create';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['delete']>[0];
    operation: 'delete';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['deleteByID']>[0];
    operation: 'deleteByID';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['find']>[0];
    operation: 'find';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findByID']>[0];
    operation: 'findByID';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findDistinct']>[0];
    /**
     * @deprecated Use 'findDistinct' operation instead
     *
     * TODO: v4 - remove this union option
     */
    operation: 'readDistinct';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findDistinct']>[0];
    operation: 'findDistinct';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findVersionByID']>[0];
    operation: 'findVersionByID';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['findVersions']>[0];
    operation: 'findVersions';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['forgotPassword']>[0];
    operation: 'forgotPassword';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['login']>[0];
    operation: 'login';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['refresh']>[0];
    operation: 'refresh';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['resetPassword']>[0];
    operation: 'resetPassword';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['restoreVersion']>[0];
    operation: 'restoreVersion';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['unlock']>[0];
    operation: 'unlock';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['update']>[0];
    operation: 'update';
} | {
    args: Parameters<OperationMap<TOperationGeneric>['updateByID']>[0];
    operation: 'updateByID';
});
//# sourceMappingURL=types.d.ts.map