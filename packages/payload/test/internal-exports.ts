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
  | 'getCurrentDate'
  | 'getRegisteredDevReloadStrategy'
  | 'importHandlerPath'
  | 'jobAfterRead'
  | 'jobSystemGlobals'
  | 'registerDevReloadStrategy'
  | 'reload'
  | 'resetJobSystemGlobals'
  | 'safeFetchGlobal'
  | 'validateBlocksFilterOptions'

type _PublicRuntimeInternals = AssertNever<
  Extract<keyof typeof PublicPayload, InternalRuntimeExport>
>
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
