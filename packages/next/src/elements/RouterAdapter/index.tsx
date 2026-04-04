'use client'
import type { RouterAdapterContextValue } from '@payloadcms/ui'
import type { LinkAdapterProps } from 'payload'

import { RouterAdapterContext } from '@payloadcms/ui'
import NextLinkImport from 'next/link.js'
import {
  useParams as useNextParams,
  usePathname as useNextPathname,
  useRouter as useNextRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation.js'
import React from 'react'

const NextLink = (
  'default' in NextLinkImport ? NextLinkImport.default : NextLinkImport
) as typeof NextLinkImport

const NextLinkAdapter: React.FC<LinkAdapterProps> = ({
  children,
  href,
  prefetch,
  ref,
  replace,
  scroll,
  ...rest
}: { ref?: React.RefObject<HTMLAnchorElement | null> } & LinkAdapterProps) => {
  return (
    <NextLink href={href} prefetch={prefetch} ref={ref} replace={replace} scroll={scroll} {...rest}>
      {children}
    </NextLink>
  )
}

export const NextRouterAdapter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const nextRouter = useNextRouter()
  const pathname = useNextPathname()
  const searchParams = useNextSearchParams()
  const params = useNextParams()

  const value: RouterAdapterContextValue = {
    Link: NextLinkAdapter,
    params: params as Record<string, string | string[]>,
    pathname,
    router: {
      back: nextRouter.back,
      push: nextRouter.push,
      refresh: nextRouter.refresh,
      replace: nextRouter.replace,
    },
    searchParams,
  }

  return <RouterAdapterContext value={value}>{children}</RouterAdapterContext>
}
