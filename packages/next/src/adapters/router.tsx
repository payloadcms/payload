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

type LinkComponent = React.FC<
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    children?: React.ReactNode
    href: string
    prefetch?: boolean
    ref?: React.Ref<HTMLAnchorElement>
    replace?: boolean
    scroll?: boolean
  }
>

const NextLink: LinkComponent =
  'default' in NextLinkImport ? NextLinkImport.default : NextLinkImport

const NextLinkAdapter: React.FC<LinkAdapterProps> = ({
  children,
  href,
  prefetch,
  ref,
  replace,
  scroll,
  ...rest
}) => {
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

  const router = React.useMemo<RouterAdapterContextValue['router']>(
    () => ({
      back: nextRouter.back,
      push: nextRouter.push,
      refresh: nextRouter.refresh,
      replace: nextRouter.replace,
    }),
    [nextRouter],
  )

  const value = React.useMemo<RouterAdapterContextValue>(
    () => ({
      Link: NextLinkAdapter,
      params,
      pathname,
      router,
      searchParams,
    }),
    [params, pathname, router, searchParams],
  )

  return <RouterAdapterContext value={value}>{children}</RouterAdapterContext>
}
