'use client'

import React, { createContext, use } from 'react'

/**
 * Wildcard-aware set of slug-stripped field paths whose admin.components.Field
 * is server-classified. Consumed by RenderField to decide whether a missing
 * `customComponents.Field` means "default field" (no custom Field expected) or
 * "loading state" (server custom Field is on the way).
 *
 * Patterns can include `*` segments (matching any single non-empty segment) so
 * the underlying componentRefs entry for `array.*.field` matches `array.0.field`
 * at lookup time without the provider having to materialize per-row paths.
 */
export type PendingServerFieldPaths = {
  /** Returns true if `path` matches any registered server-Field pattern. */
  matches(path: string): boolean
}

const Context = createContext<null | PendingServerFieldPaths>(null)

export function PendingServerFieldPathsProvider({
  children,
  patterns,
}: {
  children: React.ReactNode
  patterns: PendingServerFieldPaths
}) {
  return <Context value={patterns}>{children}</Context>
}

/** Returns the matcher when the provider is mounted, `null` otherwise. */
export function useOptionalPendingServerFieldPaths(): null | PendingServerFieldPaths {
  return use(Context)
}

/**
 * Builds a matcher from a list of slug-stripped path patterns. Each pattern
 * is split on `.`; segments are compared verbatim except `*` which matches
 * any single segment.
 */
export function createPendingServerFieldPaths(patterns: string[]): PendingServerFieldPaths {
  const parsed = patterns.map((p) => p.split('.'))
  return {
    matches(path: string): boolean {
      const segments = path.split('.')
      for (const pattern of parsed) {
        if (pattern.length !== segments.length) {
          continue
        }
        let match = true
        for (let i = 0; i < pattern.length; i++) {
          const ps = pattern[i]
          if (ps === '*') {
            continue
          }
          if (ps !== segments[i]) {
            match = false
            break
          }
        }
        if (match) {
          return true
        }
      }
      return false
    },
  }
}
