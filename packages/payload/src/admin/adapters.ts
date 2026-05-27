import type React from 'react'

import type { ImportMap, PayloadComponent } from '../index.js'

/**
 * Client-side router adapter, provided as a React component.
 * The adapter component wraps children and populates the RouterAdapterContext
 * by calling framework-specific hooks internally. This avoids passing dynamic
 * hook references through props (which violates React compiler rules).
 *
 * @example
 * ```tsx
 * // In @payloadcms/next:
 * const NextRouterAdapter: RouterAdapterComponent = ({ children }) => {
 *   const router = useNextRouter()
 *   const pathname = useNextPathname()
 *   return (
 *     <RouterAdapterContext value={{ router, pathname, ... }}>
 *       {children}
 *     </RouterAdapterContext>
 *   )
 * }
 * ```
 */
export type RouterAdapterComponent = React.ComponentType<{ children: React.ReactNode }>

export type RouterAdapterRouter = {
  back: () => void
  push: (path: string, options?: { scroll?: boolean }) => void
  refresh: () => void
  replace: (path: string, options?: { scroll?: boolean }) => void
}

export type LinkAdapterProps = {
  children?: React.ReactNode
  href: string
  prefetch?: boolean
  ref?: React.Ref<HTMLAnchorElement>
  replace?: boolean
  scroll?: boolean
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

export type CookieStore = {
  get: (name: string) => { name: string; value: string } | null | undefined
  getAll?: () => Array<{ name: string; value: string }>
  set?: (name: string, value: string, options?: CookieOptions) => void
}

export type CookieOptions = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: 'lax' | 'none' | 'strict'
  secure?: boolean
}

/**
 * Pluggable component renderer.
 * RSC-capable frameworks use the current RenderServerComponent logic.
 * Non-RSC frameworks treat all components as client components.
 */
export type ComponentRenderer = (args: {
  readonly clientProps?: object
  readonly Component?:
    | PayloadComponent
    | PayloadComponent[]
    | React.ComponentType
    | React.ComponentType[]
  readonly Fallback?: React.ComponentType
  readonly importMap: ImportMap
  readonly key?: string
  readonly serverProps?: object
}) => React.ReactNode

/**
 * Strategy for dev-mode HMR/reload detection.
 * Each framework adapter provides its own implementation.
 */
export type DevReloadStrategy = {
  connect: (onReload: () => void) => DevReloadCleanup
}

export type DevReloadCleanup = () => void
