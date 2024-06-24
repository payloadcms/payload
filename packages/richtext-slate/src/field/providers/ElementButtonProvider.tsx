'use client'

import type { FormFieldBase } from '@payloadcms/ui'

import React from 'react'

type ElementButtonContextType = {
  disabled?: boolean
  fieldProps: FormFieldBase & {
    name: string
    richTextComponentMap: Map<string, React.ReactNode>
  }
  path: string
  schemaPath: string
}

const ElementButtonContext = React.createContext<ElementButtonContextType>({
  fieldProps: {} as any,
  path: '',
  schemaPath: '',
})

export const ElementButtonProvider: React.FC<
  ElementButtonContextType & {
    children: React.ReactNode
  }
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
