'use client'
import type { DevCompileStatusContextValue } from 'payload'

import React, { createContext, use } from 'react'

/**
 * The DevCompileStatus context. Framework adapters populate this by rendering a provider
 * component that connects to the framework's own dev-server signal (e.g. Next.js's
 * webpack-hmr socket) and reports whether a compile is currently in progress.
 */
export const DevCompileStatusContext = createContext<DevCompileStatusContextValue | null>(null)

function useDevCompileStatusContext(): DevCompileStatusContextValue {
  const ctx = use(DevCompileStatusContext)
  if (!ctx) {
    throw new Error('useIsCompiling must be used within a DevCompileStatusContext provider')
  }
  return ctx
}

export function useIsCompiling(): boolean {
  return useDevCompileStatusContext().isCompiling
}

/**
 * No-op default used by frameworks that don't have a meaningful compiling signal.
 * Always reports `isCompiling: false` and attaches no listeners.
 */
export const DefaultDevCompileStatusAdapter: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <DevCompileStatusContext value={{ isCompiling: false }}>{children}</DevCompileStatusContext>
  )
}
