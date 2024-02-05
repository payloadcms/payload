import React from 'react'
import type { FieldPermissions } from 'payload/auth'
import type { SanitizedConfig } from 'payload/types'
import { buildFieldMap } from './buildFieldMap'
import { ComponentMap } from './types'

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

  return [...(config.collections || []), ...(config?.globals || [])].reduce((acc, docConfig) => {
    const { fields, slug } = docConfig

    const mappedFields = buildFieldMap({
      fieldSchema: fields,
      operation,
      permissions,
      readOnly: readOnlyOverride,
    })

    const beforeList =
      'BeforeList' in docConfig?.admin?.components && docConfig?.admin?.components?.BeforeList

    const beforeListTable =
      'BeforeListTable' in docConfig?.admin?.components &&
      docConfig?.admin?.components?.BeforeListTable

    const afterList =
      'AfterList' in docConfig?.admin?.components && docConfig?.admin?.components?.AfterList

    const afterListTable =
      'AfterListTable' in docConfig?.admin?.components &&
      docConfig?.admin?.components?.AfterListTable

    const beforeFields =
      'BeforeFields' in docConfig?.admin?.components && docConfig?.admin?.components?.BeforeFields

    const afterFields =
      'AfterFields' in docConfig?.admin?.components && docConfig?.admin?.components?.AfterFields

    const BeforeFields =
      beforeFields && Array.isArray(beforeFields) && beforeFields?.map((Component) => <Component />)

    const BeforeList =
      beforeList && Array.isArray(beforeList) && beforeList?.map((Component) => <Component />)

    const BeforeListTable =
      beforeListTable &&
      Array.isArray(beforeListTable) &&
      beforeListTable?.map((Component) => <Component />)

    const AfterFields =
      afterFields && Array.isArray(afterFields) && afterFields?.map((Component) => <Component />)

    const AfterList =
      afterList && Array.isArray(afterList) && afterList?.map((Component) => <Component />)

    const AfterListTable =
      afterListTable &&
      Array.isArray(afterListTable) &&
      afterListTable?.map((Component) => <Component />)

    const componentMap: ComponentMap['string'] = {
      BeforeList,
      AfterList,
      BeforeListTable,
      AfterListTable,
      BeforeFields,
      AfterFields,
      fields: mappedFields,
    }

    return {
      ...acc,
      [slug]: componentMap,
    }
  }, {})
}
