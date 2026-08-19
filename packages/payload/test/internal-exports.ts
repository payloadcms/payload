// eslint-disable-next-line payload/no-imports-from-self -- verifies the published root declaration surface
import type * as PublicPayload from 'payload'
// eslint-disable-next-line payload/no-imports-from-self -- verifies the published internal declaration surface
import type { OrderableEndpointBody } from 'payload/internal'
// eslint-disable-next-line payload/no-imports-from-self -- verifies the published internal declaration surface
import type * as InternalPayload from 'payload/internal'
// eslint-disable-next-line payload/no-imports-from-self -- verifies the published shared declaration surface
import type * as SharedPayload from 'payload/shared'

// eslint-disable-next-line payload/no-imports-from-self -- verifies the published internal declaration surface
import {
  getCurrentDate,
  getRegisteredDevReloadStrategy,
  importHandlerPath,
  jobAfterRead,
  jobSystemGlobals,
  registerDevReloadStrategy,
  reload,
  resetJobSystemGlobals,
  safeFetchGlobal,
  validateBlocksFilterOptions,
} from 'payload/internal'

type AssertNever<T extends never> = T
type InternalRuntimeExport =
  | 'accessOperation'
  | 'afterReadPromise'
  | 'countOperation'
  | 'createDataloaderCacheKey'
  | 'createOperation'
  | 'DEFAULT_ALLOW_HAS_MANY'
  | 'DEFAULT_HIERARCHY_TREE_LIMIT'
  | 'defaultUserCollection'
  | 'deleteByIDOperation'
  | 'deleteCollectionVersions'
  | 'deleteOperation'
  | 'docAccessOperation'
  | 'docAccessOperationGlobal'
  | 'duplicateOperation'
  | 'enforceMaxVersions'
  | 'findByIDOperation'
  | 'findOneOperation'
  | 'findOperation'
  | 'findVersionByIDOperation'
  | 'findVersionByIDOperationGlobal'
  | 'findVersionsOperation'
  | 'findVersionsOperationGlobal'
  | 'forgotPasswordOperation'
  | 'genImportMapIterateFields'
  | 'getCurrentDate'
  | 'getDefaultValue'
  | 'getFieldsToSign'
  | 'getHierarchyFieldName'
  | 'getLatestCollectionVersion'
  | 'getLatestGlobalVersion'
  | 'getLoginOptions'
  | 'getRegisteredDevReloadStrategy'
  | 'HIERARCHY_DEFAULT_LOCALE'
  | 'HIERARCHY_SLUG_PATH_FIELD'
  | 'HIERARCHY_TITLE_PATH_FIELD'
  | 'importHandlerPath'
  | 'incrementLoginAttempts'
  | 'initOperation'
  | 'injectHierarchyButton'
  | 'jobAfterRead'
  | 'jobSystemGlobals'
  | 'logoutOperation'
  | 'meOperation'
  | 'migrateCLI'
  | 'refreshOperation'
  | 'registerDevReloadStrategy'
  | 'reload'
  | 'resetJobSystemGlobals'
  | 'resetLoginAttempts'
  | 'resetPasswordOperation'
  | 'resolveHierarchyCollections'
  | 'restoreVersionOperation'
  | 'restoreVersionOperationGlobal'
  | 'safeFetchGlobal'
  | 'saveVersion'
  | 'unlockOperation'
  | 'updateByIDOperation'
  | 'updateOperation'
  | 'updateOperationGlobal'
  | 'validateBlocksFilterOptions'
  | 'verifyEmailOperation'
  | 'versionDefaults'

type _MissingInternalRuntimeExports = AssertNever<
  Exclude<InternalRuntimeExport, keyof typeof InternalPayload>
>
type _PublicRuntimeInternals = AssertNever<
  Extract<keyof typeof PublicPayload, 'EntityType' | InternalRuntimeExport>
>
type _MissingSharedEntityType = AssertNever<Exclude<'EntityType', keyof typeof SharedPayload>>
type _SharedRuntimeInternals = AssertNever<
  Extract<keyof typeof SharedPayload, 'validateBlocksFilterOptions'>
>
type _PrefixedInternalExports = AssertNever<
  Extract<
    keyof typeof InternalPayload,
    '_internal_jobSystemGlobals' | '_internal_resetJobSystemGlobals' | '_internal_safeFetchGlobal'
  >
>

// @ts-expect-error -- internal implementation detail
type _PublicOrderableEndpointBody = PublicPayload.OrderableEndpointBody

void jobSystemGlobals
void resetJobSystemGlobals
void safeFetchGlobal
void getCurrentDate
void getRegisteredDevReloadStrategy
void importHandlerPath
void jobAfterRead
void registerDevReloadStrategy
void reload
void validateBlocksFilterOptions

type InternalOrderableEndpointBody = OrderableEndpointBody

void (null as unknown as InternalOrderableEndpointBody)
