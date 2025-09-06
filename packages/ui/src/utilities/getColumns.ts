import type { I18nClient } from '@payloadcms/translations'
import type { ClientCollectionConfig, ColumnPreference } from 'payload'

import { flattenTopLevelFields } from 'payload'

import { filterFields } from '../providers/TableColumns/buildColumnState/filterFields.js'
import { getInitialColumns } from '../providers/TableColumns/getInitialColumns.js'

export const getColumns = ({
  collectionConfig,
  columns,
  i18n,
  isPolymorphic,
}: {
  collectionConfig?: ClientCollectionConfig
  columns: ColumnPreference[]
  i18n: I18nClient
  isPolymorphic?: boolean
}) =>
  columns
    ? columns?.filter((column) =>
        flattenTopLevelFields(collectionConfig?.fields, {
          i18n,
          keepPresentationalFields: true,
          moveSubFieldsToTop: true,
        })?.some((field) => {
          const accessor =
            'accessor' in field ? field.accessor : 'name' in field ? field.name : undefined
          return accessor === column.accessor
        }),
      )
    : getInitialColumns(
        isPolymorphic ? collectionConfig?.fields : filterFields(collectionConfig?.fields),
        collectionConfig.admin?.useAsTitle,
        isPolymorphic ? [] : collectionConfig?.admin?.defaultColumns,
      )
