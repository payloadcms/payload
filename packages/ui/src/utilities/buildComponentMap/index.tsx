import React from 'react'
import type { FieldPermissions } from 'payload/auth'
import type { SanitizedConfig } from 'payload/types'
import { mapFields } from './mapFields'
import { CollectionComponentMap, ComponentMap, GlobalComponentMap } from './types'
import { mapColumns } from './mapColumns'
import { getInitialColumns } from './getInitialColumns'

export const buildComponentMap = (args: {
  config: SanitizedConfig
  operation?: 'create' | 'update'
  permissions?:
    | {
        [field: string]: FieldPermissions
      }
    | FieldPermissions
  readOnly?: boolean
}): ComponentMap => {
  const { config, operation = 'update', permissions, readOnly: readOnlyOverride } = args

  // Collections
  const collections = config.collections.reduce((acc, collectionConfig) => {
    const {
      fields,
      slug,
      admin: { useAsTitle, defaultColumns },
    } = collectionConfig

    const beforeList = collectionConfig?.admin?.components?.BeforeList

    const beforeListTable = collectionConfig?.admin?.components?.BeforeListTable

    const afterList = collectionConfig?.admin?.components?.AfterList

    const afterListTable = collectionConfig?.admin?.components?.AfterListTable

    const BeforeList =
      beforeList && Array.isArray(beforeList) && beforeList?.map((Component) => <Component />)

    const BeforeListTable =
      beforeListTable &&
      Array.isArray(beforeListTable) &&
      beforeListTable?.map((Component) => <Component />)

    const AfterList =
      afterList && Array.isArray(afterList) && afterList?.map((Component) => <Component />)

    const AfterListTable =
      afterListTable &&
      Array.isArray(afterListTable) &&
      afterListTable?.map((Component) => <Component />)

    const mappedFields = mapFields({
      fieldSchema: fields,
      operation,
      permissions,
      readOnly: readOnlyOverride,
    })

    const initialColumns = getInitialColumns(fields, useAsTitle, defaultColumns)

    const componentMap: CollectionComponentMap = {
      BeforeList,
      AfterList,
      BeforeListTable,
      AfterListTable,
      fieldMap: mappedFields,
      initialColumns,
    }

    return {
      ...acc,
      [slug]: componentMap,
    }
  }, {})

  // Globals
  const globals = config.globals.reduce((acc, globalConfig) => {
    const { fields, slug } = globalConfig

    const mappedFields = mapFields({
      fieldSchema: fields,
      operation,
      permissions,
      readOnly: readOnlyOverride,
    })

    const componentMap: GlobalComponentMap = {
      fieldMap: mappedFields,
    }

    return {
      ...acc,
      [slug]: componentMap,
    }
  }, {})

  return {
    collections,
    globals,
  }
}
