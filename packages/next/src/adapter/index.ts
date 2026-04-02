import type { AdminAdapterResult, BaseAdminAdapter, CookieOptions } from 'payload'

import { notFound, redirect } from 'next/navigation.js'
import { createAdminAdapter } from 'payload'

import { handleServerFunctions } from '../utilities/handleServerFunctions.js'
import { initReq as nextInitReq } from '../utilities/initReq.js'
import { NextRouterProvider } from './RouterProvider.js'

export function nextAdapter(): AdminAdapterResult {
  return {
    name: 'next',
    init: ({ payload }) => {
      return createAdminAdapter({
        name: 'next',
        createRouteHandlers: () => {
          // Route handlers in the Next.js adapter are set up via the file-system routing
          // convention (app/api/[...slug]/route.ts) rather than being created dynamically.
          // This is a no-op for the Next.js adapter.
          return {}
        },
        deleteCookie: async (name: string) => {
          const { cookies } = await import('next/headers.js')
          const cookieStore = await cookies()
          cookieStore.delete(name)
        },
        getCookie: async (name: string) => {
          const { cookies } = await import('next/headers.js')
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value
        },
        handleServerFunctions,
        initReq: ({ config, importMap }) =>
          nextInitReq({ configPromise: config, importMap, key: 'adapter' }),
        notFound: () => notFound(),
        payload,
        redirect: (url: string) => redirect(url),
        RouterProvider: NextRouterProvider,
        setCookie: async (name: string, value: string, options?: CookieOptions) => {
          const { cookies } = await import('next/headers.js')
          const cookieStore = await cookies()
          cookieStore.set(name, value, options)
        },
      } satisfies BaseAdminAdapter)
    },
  }
}
