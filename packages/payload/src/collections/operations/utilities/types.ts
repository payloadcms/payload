import type { sendForgotPasswordEmail } from '../../../auth/operations/forgotPassword.js'
import type { logInUser } from '../../../auth/operations/login.js'
import type { refreshSession } from '../../../auth/operations/refresh.js'
import type { resetUserPassword } from '../../../auth/operations/resetPassword.js'
import type { unlockUser } from '../../../auth/operations/unlock.js'
import type { CollectionSlug, RequestContext } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { SanitizedCollectionConfig, SelectFromCollectionSlug } from '../../config/types.js'
import type { countDocuments } from '../count.js'
import type { countDocumentVersions } from '../countVersions.js'
import type { createDocument } from '../create.js'
import type { deleteDocuments } from '../delete.js'
import type { deleteDocument } from '../deleteByID.js'
import type { findDocuments } from '../find.js'
import type { findDocumentByID } from '../findByID.js'
import type { findDistinctValues } from '../findDistinct.js'
import type { findDocumentVersionByID } from '../findVersionByID.js'
import type { findDocumentVersions } from '../findVersions.js'
import type { restoreDocumentVersion } from '../restoreVersion.js'
import type { updateDocuments } from '../update.js'
import type { updateDocumentByID } from '../updateByID.js'

export type OperationMap<TOperationGeneric extends CollectionSlug> = {
  count: typeof countDocuments<TOperationGeneric>
  countVersions: typeof countDocumentVersions<TOperationGeneric>
  create: typeof createDocument<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>
  delete: typeof deleteDocuments<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>
  deleteByID: typeof deleteDocument<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>
  find: typeof findDocuments<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>
  findByID: typeof findDocumentByID<
    TOperationGeneric,
    boolean,
    SelectFromCollectionSlug<TOperationGeneric>
  >
  findDistinct: typeof findDistinctValues
  findVersionByID: typeof findDocumentVersionByID
  findVersions: typeof findDocumentVersions
  forgotPassword: typeof sendForgotPasswordEmail
  login: typeof logInUser<TOperationGeneric>
  refresh: typeof refreshSession
  resetPassword: typeof resetUserPassword<TOperationGeneric>
  restoreVersion: typeof restoreDocumentVersion
  unlock: typeof unlockUser<TOperationGeneric>
  update: typeof updateDocuments<TOperationGeneric, SelectFromCollectionSlug<TOperationGeneric>>
  updateByID: typeof updateDocumentByID<
    TOperationGeneric,
    SelectFromCollectionSlug<TOperationGeneric>
  >
}

export type AfterOperationArg<TOperationGeneric extends CollectionSlug> = {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  /**
   * Whether access control is being overridden for this operation
   */
  overrideAccess?: boolean
  req: PayloadRequest
} & (
  | {
      args: Parameters<OperationMap<TOperationGeneric>['count']>[0]
      operation: 'count'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['count']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['countVersions']>[0]
      operation: 'countVersions'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['countVersions']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['create']>[0]
      operation: 'create'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['create']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['delete']>[0]
      operation: 'delete'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['delete']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['deleteByID']>[0]
      operation: 'deleteByID'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['deleteByID']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['find']>[0]
      operation: 'find'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['find']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['findByID']>[0]
      operation: 'findByID'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['findByID']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['findDistinct']>[0]
      operation: 'findDistinct'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['findDistinct']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['findVersionByID']>[0]
      operation: 'findVersionByID'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['findVersionByID']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['findVersions']>[0]
      operation: 'findVersions'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['findVersions']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['forgotPassword']>[0]
      operation: 'forgotPassword'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['forgotPassword']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['login']>[0]
      operation: 'login'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['login']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['refresh']>[0]
      operation: 'refresh'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['refresh']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['resetPassword']>[0]
      operation: 'resetPassword'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['resetPassword']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['restoreVersion']>[0]
      operation: 'restoreVersion'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['restoreVersion']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['unlock']>[0]
      operation: 'unlock'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['unlock']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['update']>[0]
      operation: 'update'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['update']>>
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['updateByID']>[0]
      operation: 'updateByID'
      result: Awaited<ReturnType<OperationMap<TOperationGeneric>['updateByID']>>
    }
)

export type OperationResult<
  TOperationGeneric extends CollectionSlug,
  O extends keyof OperationMap<TOperationGeneric>,
> = Awaited<ReturnType<OperationMap<TOperationGeneric>[O]>>

export type OperationArgs<
  TOperationGeneric extends CollectionSlug,
  O extends keyof OperationMap<TOperationGeneric>,
> = Parameters<OperationMap<TOperationGeneric>[O]>[0]

// Map internal operation names to HookOperationType
export const operationToHookOperation = {
  count: 'count',
  countVersions: 'countVersions',
  create: 'create',
  delete: 'delete',
  deleteByID: 'delete',
  find: 'read',
  findByID: 'read',
  findDistinct: 'readDistinct',
  findVersionByID: 'read',
  findVersions: 'read',
  forgotPassword: 'forgotPassword',
  login: 'login',
  read: 'read',
  readDistinct: 'readDistinct',
  refresh: 'refresh',
  resetPassword: 'resetPassword',
  restoreVersion: 'restoreVersion',
  unlock: 'unlock',
  update: 'update',
  updateByID: 'update',
} as const

export type BeforeOperationArg<TOperationGeneric extends CollectionSlug> = {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  /**
   * Whether access control is being overridden for this operation
   */
  overrideAccess?: boolean
  req: PayloadRequest
} & (
  | {
      args:
        | Parameters<OperationMap<TOperationGeneric>['find']>[0]
        | Parameters<OperationMap<TOperationGeneric>['findByID']>[0]
      /**
       * @deprecated Use 'find' or 'findByID' operation instead
       *
       * TODO: v4 - remove this union option
       */
      operation: 'read'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['count']>[0]
      operation: 'count'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['countVersions']>[0]
      operation: 'countVersions'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['create']>[0]
      operation: 'create'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['delete']>[0]
      operation: 'delete'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['deleteByID']>[0]
      operation: 'deleteByID'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['find']>[0]
      operation: 'find'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['findByID']>[0]
      operation: 'findByID'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['findDistinct']>[0]
      /**
       * @deprecated Use 'findDistinct' operation instead
       *
       * TODO: v4 - remove this union option
       */
      operation: 'readDistinct'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['findDistinct']>[0]
      operation: 'findDistinct'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['findVersionByID']>[0]
      operation: 'findVersionByID'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['findVersions']>[0]
      operation: 'findVersions'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['forgotPassword']>[0]
      operation: 'forgotPassword'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['login']>[0]
      operation: 'login'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['refresh']>[0]
      operation: 'refresh'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['resetPassword']>[0]
      operation: 'resetPassword'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['restoreVersion']>[0]
      operation: 'restoreVersion'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['unlock']>[0]
      operation: 'unlock'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['update']>[0]
      operation: 'update'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['updateByID']>[0]
      operation: 'updateByID'
    }
)
