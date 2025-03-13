'use client'

import React, { createContext, type ReactNode, use } from 'react'

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
  return <SlatePropsContext value={{ schemaPath }}>{children}</SlatePropsContext>
}

export function useSlateProps() {
  const context = use(SlatePropsContext)
  if (!context) {
    throw new Error('useSlateProps must be used within SlatePropsProvider')
  }
  return context
}
