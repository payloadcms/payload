'use client'
import type { RouterContextType, LinkProps as RouterLinkProps } from '@payloadcms/ui'

import { RouterProvider as BaseRouterProvider } from '@payloadcms/ui'
import NextLinkImport from 'next/link.js'
import {
  useParams as useNextParams,
  usePathname as useNextPathname,
  useRouter as useNextRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation.js'
import React from 'react'

const NextLink = 'default' in NextLinkImport ? NextLinkImport.default : NextLinkImport

const AdapterLink: React.FC<RouterLinkProps> = ({ children, ...rest }) => {
  return <NextLink {...rest}>{children}</NextLink>
}

export const NextRouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const nextRouter = useNextRouter()
  const pathname = useNextPathname()
  const searchParams = useNextSearchParams()
  const params = useNextParams()

  const router: RouterContextType = React.useMemo(
    () => ({
      Link: AdapterLink,
      params,
      pathname,
      router: {
        back: nextRouter.back,
        forward: nextRouter.forward,
        prefetch: nextRouter.prefetch,
        push: nextRouter.push,
        refresh: nextRouter.refresh,
        replace: nextRouter.replace,
      },
      searchParams,
    }),
    [nextRouter, pathname, searchParams, params],
  )

  return <BaseRouterProvider router={router}>{children}</BaseRouterProvider>
}
