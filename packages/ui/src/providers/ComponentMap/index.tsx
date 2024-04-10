'use client'
import React, { createContext, useCallback, useContext } from 'react'

import type { ComponentMap, FieldMap, MappedField } from './buildComponentMap/types.js'

export type IComponentMapContext = {
  componentMap: ComponentMap
  getComponentMap: (args: {
    collectionSlug?: string
    globalSlug?: string
  }) => ComponentMap['collections'][0] | ComponentMap['globals'][0]
  getFieldMap: (args: { collectionSlug?: string; globalSlug?: string }) => [] | FieldMap
  getMappedFieldByPath: (args: {
    collectionSlug?: string
    globalSlug?: string
    path: string
  }) => MappedField | undefined
}

export { WithServerSideProps } from './buildComponentMap/WithServerSideProps.js'

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
      return fieldMap.find((field) => 'name' in field && field.name === path)
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

  const getComponentMap: IComponentMapContext['getComponentMap'] = useCallback(
    ({ collectionSlug, globalSlug }) => {
      if (collectionSlug) {
        return componentMap.collections[collectionSlug]
      }

      if (globalSlug) {
        return componentMap.globals[globalSlug]
      }

      return {} as ComponentMap['collections'][0] | ComponentMap['globals'][0]
    },
    [componentMap],
  )

  return (
    <ComponentMapContext.Provider
      value={{ componentMap, getComponentMap, getFieldMap, getMappedFieldByPath }}
    >
      {children}
    </ComponentMapContext.Provider>
  )
}

export const useComponentMap = (): IComponentMapContext => useContext(ComponentMapContext)
