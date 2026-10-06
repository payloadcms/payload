'use client'
import type { LinkAdapterProps, RouterAdapterRouter } from 'payload'

import React, { createContext, use } from 'react'

export type RouterAdapterContextValue = {
  Link: React.ComponentType<LinkAdapterProps>
  params: Record<string, string | string[]>
  pathname: string
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
  return useRouterAdapterContext().router
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
  ref,
  ...props
}: { ref?: React.RefObject<HTMLAnchorElement | null> } & LinkAdapterProps) => {
  const { Link: LinkComponent } = useRouterAdapterContext()
  return <LinkComponent {...props} ref={ref} />
}

export type { LinkAdapterProps, RouterAdapterRouter }
