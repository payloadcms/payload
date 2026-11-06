'use client'

export {
  type LayoutLoad,
  PayloadAdminShell,
  type PayloadAdminShellProps,
  payloadLayoutRoute,
  withPayloadRoot,
  type WithPayloadRootOptions,
} from '../adapters/layout/index.js'
export {
  type AdminLoad,
  payloadAdminIndexRoute,
  payloadAdminSplatRoute,
} from '../adapters/views/index.js'
export { createServerFunctionClient } from '../utilities/serverFunctionClient.js'
