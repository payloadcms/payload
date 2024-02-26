'use client'
import React, { createContext, useCallback, useContext } from 'react'

import type { ComponentMap, FieldMap, MappedField } from '../../utilities/buildComponentMap/types'

export type IComponentMapContext = {
  componentMap: ComponentMap
  getFieldMap: (args: { collectionSlug?: string; globalSlug?: string }) => [] | FieldMap
  getMappedFieldByPath: (args: {
    collectionSlug?: string
    globalSlug?: string
    path: string
  }) => MappedField | undefined
}

const ComponentMapContext = createContext<IComponentMapContext>({} as IComponentMapContext)

export const ComponentMapProvider: React.FC<{
  children: React.ReactNode
  componentMap: ComponentMap
}> = ({ children, componentMap }) => {
  const getMappedFieldByPath: IComponentMapContext['getMappedFieldByPath'] = useCallback(
    ({ collectionSlug, globalSlug, path }) => {
      let fieldMap: FieldMap

      if (collectionSlug) {
        fieldMap = componentMap.collections[collectionSlug].fieldMap
      }

      if (globalSlug) {
        fieldMap = componentMap.globals[globalSlug].fieldMap
      }

      // TODO: better lookup for nested fields, etc.
      return fieldMap.find((field) => field.name === path)
    },
    [componentMap],
  )

  const getFieldMap: IComponentMapContext['getFieldMap'] = useCallback(
    ({ collectionSlug, globalSlug }) => {
      if (collectionSlug) {
        return componentMap.collections[collectionSlug].fieldMap
      }

      if (globalSlug) {
        return componentMap.globals[globalSlug].fieldMap
      }

      return []
    },
    [componentMap],
  )

  return (
    <ComponentMapContext.Provider value={{ componentMap, getFieldMap, getMappedFieldByPath }}>
      {children}
    </ComponentMapContext.Provider>
  )
}

export const useComponentMap = (): IComponentMapContext => useContext(ComponentMapContext)
