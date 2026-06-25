'use client'

export { TanStackComponentRenderer } from '../elements/RenderComponent/index.js'
export { TanStackRouterAdapter } from '../elements/RouterAdapter/index.js'
export {
  buildThemeInitScript,
  PayloadAdminShell,
  type PayloadAdminShellProps,
  THEME_INIT_SCRIPT,
  withPayloadRoot,
  type WithPayloadRootOptions,
} from '../layouts/Root/withPayloadRoot.js'
export {
  type AdminLoad,
  payloadAdminIndexRoute,
  payloadAdminSplatRoute,
} from '../routes/adminRoutes.js'
export { type LayoutLoad, payloadLayoutRoute } from '../routes/layoutRoute.js'
export { viteDevReloadStrategy } from '../utilities/devReloadStrategy.js'
export {
  createServerFunctionClient,
  stripUnserializable,
} from '../utilities/serverFunctionClient.js'
