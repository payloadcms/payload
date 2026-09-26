import type { GlobalSlug, RequestContext } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type {
  DataFromGlobalSlug,
  SanitizedGlobalConfig,
  SelectFromGlobalSlug,
} from '../../config/types.js'
import type { countGlobalVersionsOperation } from '../countGlobalVersions.js'
import type { findOneOperation } from '../findOne.js'
import type { restoreVersionOperation } from '../restoreVersion.js'
import type { updateOperation } from '../update.js'

export type OperationMap<TOperationGeneric extends GlobalSlug> = {
  countVersions: typeof countGlobalVersionsOperation<TOperationGeneric>
  read: typeof findOneOperation<DataFromGlobalSlug<TOperationGeneric>>
  restoreVersion: typeof restoreVersionOperation
  update: typeof updateOperation<TOperationGeneric, SelectFromGlobalSlug<TOperationGeneric>>
}

export type OperationArgs<
  TOperationGeneric extends GlobalSlug,
  O extends keyof OperationMap<TOperationGeneric>,
> = Parameters<OperationMap<TOperationGeneric>[O]>[0]

export type BeforeOperationArg<TOperationGeneric extends GlobalSlug> = {
  context: RequestContext
  /** The global which this hook is being run on */
  global: SanitizedGlobalConfig
  /**
   * Whether access control is being overridden for this operation
   */
  overrideAccess?: boolean
  req: PayloadRequest
} & (
  | {
      args: Parameters<OperationMap<TOperationGeneric>['countVersions']>[0]
      operation: 'countVersions'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['read']>[0]
      operation: 'read'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['restoreVersion']>[0]
      operation: 'restoreVersion'
    }
  | {
      args: Parameters<OperationMap<TOperationGeneric>['update']>[0]
      operation: 'update'
    }
)
