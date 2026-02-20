'use client'

import React from 'react'

import type { LoadedSlateFieldProps } from '../types.js'

type LeafContextType = {
  attributes: Record<string, unknown>
  children: React.ReactNode
  editorRef: React.RefObject<HTMLDivElement>
  fieldProps: LoadedSlateFieldProps
  leaf: string
  path: string
  schemaPath: string
}

const LeafContext = React.createContext<LeafContextType>({
  attributes: {},
  children: null,
  editorRef: null,
  fieldProps: {} as any,
  leaf: '',
  path: '',
  schemaPath: '',
})

export const LeafProvider: React.FC<
  {
    result: React.ReactNode
  } & LeafContextType
> = (props) => {
  const { children, result, ...rest } = props

  return (
    <LeafContext
      value={{
        ...rest,
        children: result,
      }}
    >
      {children}
    </LeafContext>
  )
}

export const useLeaf = () => {
  const path = React.use(LeafContext)
  return path
}
