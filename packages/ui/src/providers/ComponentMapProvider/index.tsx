'use client'
import React, { createContext, useCallback, useContext } from 'react'
import { ComponentMap, FieldMap, MappedField } from '../../utilities/buildComponentMap/types'

type IComponentMapContext = {
  componentMap: ComponentMap
  getMappedFieldByPath: (args: {
    path: string
    collectionSlug?: string
    globalSlug?: string
  }) => MappedField | undefined
}

const ComponentMapContext = createContext<IComponentMapContext>({} as IComponentMapContext)

export const ComponentMapProvider: React.FC<{
  children: React.ReactNode
  componentMap: ComponentMap
}> = ({ children, componentMap }) => {
  const getMappedFieldByPath = useCallback(
    (args: { path: string; collectionSlug?: string; globalSlug?: string }) => {
      const { path, collectionSlug, globalSlug } = args
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

  return (
    <ComponentMapContext.Provider value={{ componentMap, getMappedFieldByPath }}>
      {children}
    </ComponentMapContext.Provider>
  )
}

export const useComponentMap = (): IComponentMapContext => useContext(ComponentMapContext)
