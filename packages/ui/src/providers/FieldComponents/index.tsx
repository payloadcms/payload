'use client'
import type { FieldTypes } from 'payload'

import React, { createContext, useContext } from 'react'

import { fieldComponents } from '../../fields/index.js'

export type IFieldComponentsContext = FieldTypes

const FieldComponentsContext = createContext<IFieldComponentsContext>(fieldComponents)

export const FieldComponentsProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <FieldComponentsContext.Provider value={fieldComponents}>
      {children}
    </FieldComponentsContext.Provider>
  )
}

export const useFieldComponents = (): IFieldComponentsContext => useContext(FieldComponentsContext)
