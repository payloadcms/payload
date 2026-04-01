'use client'
import React, { createContext, use } from 'react'

export type ServerNavigationContextType = {
  notFound: () => never
  redirect: (url: string) => never
}

const ServerNavigationContext = createContext<null | ServerNavigationContextType>(null)

export const ServerNavigationProvider: React.FC<{
  children: React.ReactNode
  notFound: () => never
  redirect: (url: string) => never
}> = ({ children, notFound, redirect }) => {
  return (
    <ServerNavigationContext value={{ notFound, redirect }}>{children}</ServerNavigationContext>
  )
}

export function useServerNavigation(): ServerNavigationContextType {
  const ctx = use(ServerNavigationContext)
  if (!ctx) {
    throw new Error(
      'ServerNavigationProvider is not in the tree. Make sure your admin adapter provides one.',
    )
  }
  return ctx
}
