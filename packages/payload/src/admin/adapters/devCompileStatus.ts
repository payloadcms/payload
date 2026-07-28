import type React from 'react'

/**
 * Client-side adapter that reports whether the dev server is currently compiling/rebuilding.
 * Each framework adapter provides its own implementation. Unlike other adapters, this one is
 * optional — frameworks without a meaningful compiling signal can omit it and fall back to a
 * no-op default that always reports `isCompiling: false`.
 */
export type DevCompileStatusAdapterComponent = React.ComponentType<{ children: React.ReactNode }>

export type DevCompileStatusContextValue = {
  isCompiling: boolean
}
