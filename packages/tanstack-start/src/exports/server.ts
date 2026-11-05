export { handleServerFunctions } from '../adapters/handleServerFunctions.js'
export { type AdminPageMetadata, getAdminMeta } from '../adapters/metadata.js'
export {
  createPageRenderServerAdapter,
  type PageNavIntent,
  tanstackServerAdapter,
} from '../adapters/server.js'
export {
  loadAdminPage,
  type LoadAdminPageArgs,
  type LoadAdminPageResult,
} from '../adapters/views/server.js'
export { login } from '../auth/login.js'
export { logout } from '../auth/logout.js'
export { refresh } from '../auth/refresh.js'
export { handleGraphQL } from '../routes/graphql/handler.server.js'
export { handleAPIRoute } from '../routes/rest/handler.server.js'
export { getRequestI18n } from '../utilities/getRequestI18n.server.js'
export { getRequestTheme } from '@payloadcms/ui/utilities/getRequestTheme'
