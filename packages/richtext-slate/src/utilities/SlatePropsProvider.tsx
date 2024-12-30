'use client'

import React, { createContext, type ReactNode, useContext } from 'react'

interface SlateProps {
  schemaPath: string
}

const SlatePropsContext = createContext<SlateProps | undefined>(undefined)

export function SlatePropsProvider({
  children,
  schemaPath,
}: {
  children: ReactNode
  schemaPath: string
}) {
  return <SlatePropsContext.Provider value={{ schemaPath }}>{children}</SlatePropsContext.Provider>
}

export function useSlateProps() {
  const context = useContext(SlatePropsContext)
  if (!context) {
    throw new Error('useSlateProps must be used within SlatePropsProvider')
  }
  return context
}
