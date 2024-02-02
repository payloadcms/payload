'use client'
import React, { createContext, useContext } from 'react'

import { FieldMaps } from '../../forms/utilities/buildFieldMaps/types'

const FieldMapsContext = createContext<FieldMaps>({} as FieldMaps)

export const FieldMapsProvider: React.FC<{
  children: React.ReactNode
  fieldMaps: FieldMaps
}> = ({ children, fieldMaps }) => {
  return <FieldMapsContext.Provider value={fieldMaps}>{children}</FieldMapsContext.Provider>
}

export const useFieldMaps = (): FieldMaps => useContext(FieldMapsContext)
