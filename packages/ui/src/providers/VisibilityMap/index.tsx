'use client'

import React, { createContext, use } from 'react'

const VisibilityMapContext = createContext<Map<string, boolean> | null>(null)

export type VisibilityMapProviderProps = {
  children: React.ReactNode
  map: Map<string, boolean>
}

export function VisibilityMapProvider({ children, map }: VisibilityMapProviderProps) {
  return <VisibilityMapContext value={map}>{children}</VisibilityMapContext>
}

export function useVisibilityMap(): Map<string, boolean> {
  const ctx = use(VisibilityMapContext)
  if (!ctx) {
    throw new Error('useVisibilityMap must be used within VisibilityMapProvider')
  }
  return ctx
}

export function useVisibility(path: string): boolean {
  const ctx = use(VisibilityMapContext)
  if (!ctx) {
    return true
  }
  const result = ctx.get(path)
  return result === undefined ? true : result
}
