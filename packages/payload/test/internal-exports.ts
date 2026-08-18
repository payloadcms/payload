// eslint-disable-next-line payload/no-imports-from-self -- verifies the published root declaration surface
import type * as PublicPayload from 'payload'
// eslint-disable-next-line payload/no-imports-from-self -- verifies the published internal declaration surface
import type { OrderableEndpointBody } from 'payload/internal'
// eslint-disable-next-line payload/no-imports-from-self -- verifies the published shared declaration surface
import type * as SharedPayload from 'payload/shared'

// eslint-disable-next-line payload/no-imports-from-self -- verifies the published internal declaration surface
import {
  _internal_jobSystemGlobals,
  _internal_resetJobSystemGlobals,
  _internal_safeFetchGlobal,
  getCurrentDate,
  getRegisteredDevReloadStrategy,
  importHandlerPath,
  jobAfterRead,
  registerDevReloadStrategy,
  reload,
  validateBlocksFilterOptions,
} from 'payload/internal'

type AssertNever<T extends never> = T
type InternalRuntimeExport =
  | '_internal_jobSystemGlobals'
  | '_internal_resetJobSystemGlobals'
  | '_internal_safeFetchGlobal'
  | 'getCurrentDate'
  | 'getRegisteredDevReloadStrategy'
  | 'importHandlerPath'
  | 'jobAfterRead'
  | 'registerDevReloadStrategy'
  | 'reload'
  | 'validateBlocksFilterOptions'

type _PublicRuntimeInternals = AssertNever<
  Extract<keyof typeof PublicPayload, InternalRuntimeExport>
>
type _SharedRuntimeInternals = AssertNever<
  Extract<keyof typeof SharedPayload, 'validateBlocksFilterOptions'>
>

// @ts-expect-error -- internal implementation detail
type _PublicOrderableEndpointBody = PublicPayload.OrderableEndpointBody

void _internal_jobSystemGlobals
void _internal_resetJobSystemGlobals
void _internal_safeFetchGlobal
void getCurrentDate
void getRegisteredDevReloadStrategy
void importHandlerPath
void jobAfterRead
void registerDevReloadStrategy
void reload
void validateBlocksFilterOptions

type InternalOrderableEndpointBody = OrderableEndpointBody

void (null as unknown as InternalOrderableEndpointBody)
