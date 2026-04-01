import type React from 'react'

export type LinkProps = {
  children?: React.ReactNode
  href: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  prefetch?: boolean
  replace?: boolean
  scroll?: boolean
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'>

export type RouterInstance = {
  back: () => void
  forward: () => void
  prefetch: (url: string) => void
  push: (url: string) => void
  refresh: () => void
  replace: (url: string) => void
}

/**
 * Values provided by a RouterProvider. The adapter creates a component that
 * calls framework-specific hooks and places the results here, so that
 * `packages/ui` never imports from any framework directly.
 */
export type RouterContextType = {
  Link: React.ComponentType<LinkProps>
  params: Record<string, string | string[]>
  pathname: string
  router: RouterInstance
  searchParams: URLSearchParams
}
