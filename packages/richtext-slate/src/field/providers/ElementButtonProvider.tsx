'use client'

import type { FormFieldBase } from 'payload'

import React from 'react'

type ElementButtonContextType = {
  disabled?: boolean
  fieldProps: {
    name: string
    richTextComponentMap: Map<string, React.ReactNode>
  } & FormFieldBase
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
    <ElementButtonContext.Provider
      value={{
        ...rest,
      }}
    >
      {children}
    </ElementButtonContext.Provider>
  )
}

export const useElementButton = () => {
  const path = React.useContext(ElementButtonContext)
  return path
}
