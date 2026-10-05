'use client'

export {
  type LayoutLoad,
  PayloadAdminShell,
  type PayloadAdminShellProps,
  payloadLayoutRoute,
  withPayloadRoot,
  type WithPayloadRootOptions,
} from '../adapters/layout.js'
export { TanStackRouterAdapter } from '../adapters/router.js'
export {
  type AdminLoad,
  payloadAdminIndexRoute,
  payloadAdminSplatRoute,
} from '../adapters/views.js'
export {
  createServerFunctionClient,
  stripUnserializable,
} from '../utilities/serverFunctionClient.js'
