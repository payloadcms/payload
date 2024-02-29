import type { FieldPermissions } from 'payload/auth'
import type { EditViewProps } from 'payload/config'
import type { SanitizedConfig } from 'payload/types'

import React from 'react'

import type { CollectionComponentMap, ComponentMap, GlobalComponentMap } from './types'

import { mapFields } from './mapFields'

export const buildComponentMap = (args: {
  DefaultCell: React.FC<any>
  DefaultEditView: React.FC<EditViewProps>
  DefaultListView: React.FC<EditViewProps>
  config: SanitizedConfig
  operation?: 'create' | 'update'
  permissions?:
    | {
        [field: string]: FieldPermissions
      }
    | FieldPermissions
  readOnly?: boolean
}): ComponentMap => {
  const {
    DefaultCell,
    DefaultEditView,
    DefaultListView,
    config,
    operation = 'update',
    permissions,
    readOnly: readOnlyOverride,
  } = args

  // Collections
  const collections = config.collections.reduce((acc, collectionConfig) => {
    const { slug, fields } = collectionConfig

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
    const List = CustomListView || DefaultListView

    const beforeList = collectionConfig?.admin?.components?.BeforeList

    const beforeListTable = collectionConfig?.admin?.components?.BeforeListTable

    const afterList = collectionConfig?.admin?.components?.AfterList

    const afterListTable = collectionConfig?.admin?.components?.AfterListTable

    const BeforeList =
      (beforeList && Array.isArray(beforeList) && beforeList?.map((Component) => <Component />)) ||
      null

    const BeforeListTable =
      (beforeListTable &&
        Array.isArray(beforeListTable) &&
        beforeListTable?.map((Component) => <Component />)) ||
      null

    const AfterList =
      (afterList && Array.isArray(afterList) && afterList?.map((Component) => <Component />)) ||
      null

    const AfterListTable =
      (afterListTable &&
        Array.isArray(afterListTable) &&
        afterListTable?.map((Component) => <Component />)) ||
      null

    const mappedFields = mapFields({
      DefaultCell,
      config,
      fieldSchema: fields,
      operation,
      permissions,
      readOnly: readOnlyOverride,
    })

    let AdminThumbnail = null
    if (typeof collectionConfig?.upload?.adminThumbnail === 'function') {
      AdminThumbnail = collectionConfig?.upload?.adminThumbnail
    } else if (typeof collectionConfig?.upload?.adminThumbnail === 'string') {
      AdminThumbnail = () => collectionConfig?.upload?.adminThumbnail
    }

    const componentMap: CollectionComponentMap = {
      AdminThumbnail,
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
    const { slug, fields } = globalConfig

    const mappedFields = mapFields({
      DefaultCell,
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
