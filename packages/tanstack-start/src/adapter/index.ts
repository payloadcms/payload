import type { AdminAdapterResult, BaseAdminAdapter, CookieOptions } from 'payload'

import { notFound, redirect } from '@tanstack/react-router'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'
import { createAdminAdapter } from 'payload'

import { handleServerFunctions } from '../utilities/handleServerFunctions.js'
import { initReq } from '../utilities/initReq.js'
import { TanStackRouterProvider } from './RouterProvider.js'

/**
 * TanStack Start admin adapter for Payload CMS.
 *
 * Usage in payload.config.ts:
 * ```ts
 * import { tanstackStartAdapter } from '@payloadcms/tanstack-start'
 *
 * export default buildConfig({
 *   admin: { adapter: tanstackStartAdapter() },
 * })
 * ```
 */
export function tanstackStartAdapter(): AdminAdapterResult {
  return {
    name: 'tanstack-start',
    init: ({ payload }) =>
      createAdminAdapter({
        name: 'tanstack-start',
        createRouteHandlers: () => ({}), // Vinxi handles routing via file-system
        deleteCookie: (name) => deleteCookie(name),
        getCookie: (name) => getCookie(name),
        handleServerFunctions,
        initReq: ({ config, importMap }) => initReq({ config, importMap }),
        notFound: () => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw notFound()
        },
        payload,
        redirect: (url) => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw redirect({ to: url })
        },
        RouterProvider: TanStackRouterProvider,
        setCookie: (name, value, options?: CookieOptions) => setCookie(name, value, options),
      } satisfies BaseAdminAdapter),
  }
}
