'use client'
import React, { createContext, use } from 'react'

const Context = createContext(false)

export const TabsProvider: React.FC<{ children?: React.ReactNode; withinTab?: boolean }> = ({
  children,
  withinTab = true,
}) => {
  return <Context value={withinTab}>{children}</Context>
}

export const useTabs = (): boolean => use(Context)
