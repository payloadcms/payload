'use client'
import type React from 'react'

import { useAuth } from '@payloadcms/ui'
import { createContext } from 'react'

const DummyContext = createContext<null>(null)

/**
 * This provider changes its rendered tree structure when the user authenticates.
 * Before login:  <DummyContext.Provider>{children}</DummyContext.Provider>
 * After login:   <>{children}</>
 *
 * This tree structure change causes React to REMOUNT all children,
 * which is a valid pattern that the multi-tenant plugin must handle.
 */
export const ConditionalWrapperProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth()

  if (user) {
    return <>{children}</>
  }

  return <DummyContext value={null}>{children}</DummyContext>
}
