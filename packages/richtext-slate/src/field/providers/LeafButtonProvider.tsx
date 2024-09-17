'use client'

import React from 'react'

import type { LoadedSlateFieldProps } from '../types.js'

type LeafButtonContextType = {
  fieldProps: LoadedSlateFieldProps
  path: string
  schemaPath: string
}

const LeafButtonContext = React.createContext<LeafButtonContextType>({
  fieldProps: {} as any,
  path: '',
  schemaPath: '',
})

export const LeafButtonProvider: React.FC<
  {
    children: React.ReactNode
  } & LeafButtonContextType
> = (props) => {
  const { children, ...rest } = props

  return (
    <LeafButtonContext.Provider
      value={{
        ...rest,
      }}
    >
      {children}
    </LeafButtonContext.Provider>
  )
}

export const useLeafButton = () => {
  const path = React.useContext(LeafButtonContext)
  return path
}
