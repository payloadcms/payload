import type { AdminAdapterResult, BaseAdminAdapter, CookieOptions, InitReqResult } from 'payload'

import { createAdminAdapter } from 'payload'

import { TanStackRouterProvider } from './RouterProvider.js'

/**
 * TanStack Start admin adapter for Payload CMS.
 *
 * Proof-of-concept scaffold. Full implementation requires
 * @tanstack/start, @tanstack/react-router, and vinxi.
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
    init: ({ payload }) => {
      return createAdminAdapter({
        name: 'tanstack-start',
        createRouteHandlers: () => {
          // In TanStack Start, API routes use Vinxi file-system routing.
          return {}
        },
        deleteCookie: (_name: string): void => {
          // Implement: import { deleteCookie } from 'vinxi/http'; deleteCookie(name)
          throw new Error('tanstackStartAdapter: deleteCookie not yet implemented.')
        },
        getCookie: (_name: string): string | undefined => {
          // Implement: import { getCookie } from 'vinxi/http'; return getCookie(name)
          throw new Error('tanstackStartAdapter: getCookie not yet implemented.')
        },
        handleServerFunctions: (_args): Promise<unknown> => {
          // Implement using @tanstack/start createServerFn()
          throw new Error('tanstackStartAdapter: handleServerFunctions not yet implemented.')
        },
        initReq: (_args): Promise<InitReqResult> => {
          // Implement: import { getWebRequest } from 'vinxi/http'; use getWebRequest()
          throw new Error('tanstackStartAdapter: initReq not yet implemented.')
        },
        notFound: (): never => {
          // Implement: import { notFound } from '@tanstack/react-router'; throw notFound()
          throw new Error('Not found')
        },
        payload,
        redirect: (url: string): never => {
          // Implement: import { redirect } from '@tanstack/react-router'; throw redirect({ to: url })
          throw new Error(`Redirect to ${url}`)
        },
        RouterProvider: TanStackRouterProvider,
        setCookie: (_name: string, _value: string, _options?: CookieOptions): void => {
          // Implement: import { setCookie } from 'vinxi/http'; setCookie(name, value, options)
          throw new Error('tanstackStartAdapter: setCookie not yet implemented.')
        },
      } satisfies BaseAdminAdapter)
    },
  }
}
