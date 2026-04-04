import type React from 'react'

import type { ImportMap, PayloadComponent } from '../index.js'

/**
 * Client-side router abstraction provided via React context.
 * Each framework adapter implements this contract using its own routing primitives.
 */
export type RouterAdapter = {
  Link: React.ComponentType<LinkAdapterProps>
  useParams: () => Record<string, string | string[]>
  usePathname: () => string
  useRouter: () => RouterAdapterRouter
  useSearchParams: () => URLSearchParams
}

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
  replace?: boolean
  scroll?: boolean
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

/**
 * Server-side adapter passed into server functions (not React context).
 * Abstracts framework-specific server APIs like cookies, headers, redirect.
 */
export type ServerAdapter = {
  getCookies: () => CookieStore | Promise<CookieStore>
  getHeaders: () => Headers | Promise<Headers>
  notFound: () => never
  redirect: (path: string) => never
  setCookie: (name: string, value: string, options?: CookieOptions) => Promise<void> | void
}

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
