'use client'

import React, { createContext, useContext } from 'react'

import type { FieldTypesComponents } from '../../fields/index.js'

export type IFieldComponentsContext = FieldTypesComponents

const FieldComponentsContext = createContext<IFieldComponentsContext>(null)

export const FieldComponentsProvider: React.FC<{
  readonly children: React.ReactNode
  readonly fieldComponents: FieldTypesComponents
}> = ({ children, fieldComponents }) => {
  return (
    <FieldComponentsContext.Provider value={fieldComponents}>
      {children}
    </FieldComponentsContext.Provider>
  )
}

export const useFieldComponents = (): IFieldComponentsContext => useContext(FieldComponentsContext)
