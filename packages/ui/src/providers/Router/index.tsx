'use client'
import React, { createContext, use } from 'react'

import type { LinkProps, RouterContextType, RouterInstance } from './types.js'

export type { LinkProps, RouterContextType, RouterInstance }

const RouterContext = createContext<null | RouterContextType>(null)

export const RouterProvider: React.FC<{
  children: React.ReactNode
  router: RouterContextType
}> = ({ children, router }) => {
  return <RouterContext value={router}>{children}</RouterContext>
}

function useRouterContext(): RouterContextType {
  const ctx = use(RouterContext)
  if (!ctx) {
    throw new Error('RouterProvider is not in the tree. Make sure your admin adapter provides one.')
  }
  return ctx
}

export const useRouter = (): RouterInstance => useRouterContext().router

export const usePathname = (): string => useRouterContext().pathname

export const useSearchParams = (): URLSearchParams => useRouterContext().searchParams

export const useParams = (): Record<string, string | string[]> => useRouterContext().params

export const Link: React.FC<LinkProps> = (props) => {
  const { Link: AdapterLink } = useRouterContext()
  return <AdapterLink {...props} />
}
