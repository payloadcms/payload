'use client'
import type { LinkAdapterProps, RouterAdapterRouter } from 'payload'

import React, { createContext, use, useMemo } from 'react'

export type RouterAdapterContextValue = {
  Link: React.ComponentType<LinkAdapterProps>
  params: Record<string, string | string[]>
  pathname: string
  /** Resolves admin destinations against the active content branch. */
  resolveHref?: (href: string) => string
  router: RouterAdapterRouter
  searchParams: URLSearchParams
}

/**
 * The RouterAdapter context. Framework adapters populate this by rendering a
 * provider component that calls framework-specific hooks (e.g. next/navigation)
 * and passes the values here. This avoids calling dynamic hooks from props,
 * which would violate React compiler rules.
 */
export const RouterAdapterContext = createContext<null | RouterAdapterContextValue>(null)

function useRouterAdapterContext(): RouterAdapterContextValue {
  const ctx = use(RouterAdapterContext)
  if (!ctx) {
    throw new Error(
      'useRouter/usePathname/useSearchParams/useParams must be used within a RouterAdapterProvider',
    )
  }
  return ctx
}

export function useRouter(): RouterAdapterRouter {
  const { resolveHref, router } = useRouterAdapterContext()

  return useMemo(() => {
    if (!resolveHref) {
      return router
    }

    return {
      ...router,
      push: (href, options) => router.push(resolveHref(href), options),
      replace: (href, options) => router.replace(resolveHref(href), options),
      ...(router.replaceState
        ? { replaceState: (href: string) => router.replaceState(resolveHref(href)) }
        : {}),
    } satisfies RouterAdapterRouter
  }, [resolveHref, router])
}

export function useNavigationURL({ href }: { href: string }): string {
  const { resolveHref } = useRouterAdapterContext()

  return resolveHref ? resolveHref(href) : href
}

export function usePathname(): string {
  return useRouterAdapterContext().pathname
}

export function useSearchParams(): URLSearchParams {
  return useRouterAdapterContext().searchParams
}

export function useParams(): Record<string, string | string[]> {
  return useRouterAdapterContext().params
}

export const PayloadLink: React.FC<{ ref?: React.Ref<HTMLAnchorElement> } & LinkAdapterProps> = ({
  href,
  ref,
  ...props
}: { ref?: React.RefObject<HTMLAnchorElement | null> } & LinkAdapterProps) => {
  const { Link: LinkComponent, resolveHref } = useRouterAdapterContext()
  return <LinkComponent {...props} href={resolveHref ? resolveHref(href) : href} ref={ref} />
}

export type { LinkAdapterProps, RouterAdapterRouter }
