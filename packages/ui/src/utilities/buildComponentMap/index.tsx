import type { FieldPermissions } from 'payload/auth'
import type { EditViewProps } from 'payload/config'
import type { SanitizedConfig } from 'payload/types'

import React from 'react'

import type { CollectionComponentMap, ComponentMap, GlobalComponentMap } from './types'

import { DefaultEditView } from '../../views/Edit'
import { DefaultList } from '../../views/List'
import { mapFields } from './mapFields'

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
    const { fields, slug } = collectionConfig

    const editViewFromConfig = collectionConfig?.admin?.components?.views?.Edit
    const listViewFromConfig = collectionConfig?.admin?.components?.views?.List

    const CustomEditView =
      typeof editViewFromConfig === 'function'
        ? editViewFromConfig
        : typeof editViewFromConfig === 'object' && typeof editViewFromConfig.Default === 'function'
          ? editViewFromConfig.Default
          : typeof editViewFromConfig?.Default === 'object' &&
              'Component' in editViewFromConfig.Default &&
              typeof editViewFromConfig.Default.Component === 'function'
            ? (editViewFromConfig.Default.Component as React.FC<EditViewProps>)
            : undefined

    const CustomListView =
      typeof listViewFromConfig === 'function'
        ? listViewFromConfig
        : typeof listViewFromConfig === 'object' &&
            typeof listViewFromConfig.Component === 'function'
          ? listViewFromConfig.Component
          : undefined

    const Edit = CustomEditView || DefaultEditView
    const List = CustomListView || DefaultList

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
      config,
      fieldSchema: fields,
      operation,
      permissions,
      readOnly: readOnlyOverride,
    })

    const componentMap: CollectionComponentMap = {
      AfterList,
      AfterListTable,
      BeforeList,
      BeforeListTable,
      Edit: <Edit collectionSlug={collectionConfig.slug} />,
      List: <List collectionSlug={collectionConfig.slug} />,
      fieldMap: mappedFields,
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
      config,
      fieldSchema: fields,
      operation,
      permissions,
      readOnly: readOnlyOverride,
    })

    const editViewFromConfig = globalConfig?.admin?.components?.views?.Edit

    const CustomEditView =
      typeof editViewFromConfig === 'function'
        ? editViewFromConfig
        : typeof editViewFromConfig === 'object' && typeof editViewFromConfig.Default === 'function'
          ? editViewFromConfig.Default
          : typeof editViewFromConfig?.Default === 'object' &&
              'Component' in editViewFromConfig.Default &&
              typeof editViewFromConfig.Default.Component === 'function'
            ? (editViewFromConfig.Default.Component as React.FC<EditViewProps>)
            : undefined

    const Edit = CustomEditView || DefaultEditView

    const componentMap: GlobalComponentMap = {
      Edit: <Edit globalSlug={globalConfig.slug} />,
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
