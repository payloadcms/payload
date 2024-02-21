'use client'
import React from 'react'

import type { FormFieldBase } from '../../../../ui/src/forms/fields/shared'

type LeafButtonContextType = {
  fieldProps: FormFieldBase & {
    name: string
  }
  path: string
  schemaPath: string
}

const LeafButtonContext = React.createContext<LeafButtonContextType>({
  fieldProps: {} as any,
  path: '',
  schemaPath: '',
})

export const LeafButtonProvider: React.FC<
  LeafButtonContextType & {
    children: React.ReactNode
  }
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
