'use client'

import React from 'react'

import type { LoadedSlateFieldProps } from '../types.js'

type ElementButtonContextType = {
  disabled?: boolean
  fieldProps: LoadedSlateFieldProps
  path: string
  schemaPath: string
}

const ElementButtonContext = React.createContext<ElementButtonContextType>({
  fieldProps: {} as any,
  path: '',
  schemaPath: '',
})

export const ElementButtonProvider: React.FC<
  {
    children: React.ReactNode
  } & ElementButtonContextType
> = (props) => {
  const { children, ...rest } = props

  return (
    <ElementButtonContext
      value={{
        ...rest,
      }}
    >
      {children}
    </ElementButtonContext>
  )
}

export const useElementButton = () => {
  const path = React.use(ElementButtonContext)
  return path
}
