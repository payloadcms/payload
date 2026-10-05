'use client'

export {
  PayloadAdminShell,
  type PayloadAdminShellProps,
  withPayloadRoot,
  type WithPayloadRootOptions,
} from '../adapters/layout.js'
export { TanStackRouterAdapter } from '../adapters/router.js'
export {
  type AdminLoad,
  payloadAdminIndexRoute,
  payloadAdminSplatRoute,
} from '../routes/adminRoutes.js'
export { type LayoutLoad, payloadLayoutRoute } from '../routes/layoutRoute.js'
export {
  createServerFunctionClient,
  stripUnserializable,
} from '../utilities/serverFunctionClient.js'
