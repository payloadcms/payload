'use client'

import React, { createContext, useContext } from 'react'

import type { FieldTypesComponents } from '../../fields/index.js'

import { fieldComponents } from '../../fields/index.js'

export type IFieldComponentsContext = FieldTypesComponents

const FieldComponentsContext = createContext<IFieldComponentsContext>(fieldComponents)

export const FieldComponentsProvider: React.FC<{
  readonly children: React.ReactNode
}> = ({ children }) => {
  return (
    <FieldComponentsContext.Provider value={fieldComponents}>
      {children}
    </FieldComponentsContext.Provider>
  )
}

export const useFieldComponents = (): IFieldComponentsContext => useContext(FieldComponentsContext)
