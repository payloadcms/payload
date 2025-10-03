import type { I18nClient } from '@payloadcms/translations'
import type { ClientCollectionConfig, ClientConfig, ColumnPreference } from 'payload'

import { flattenTopLevelFields } from 'payload'
import { fieldAffectsData } from 'payload/shared'

import { filterFields } from '../providers/TableColumns/buildColumnState/filterFields.js'
import { getInitialColumns } from '../providers/TableColumns/getInitialColumns.js'

export const getColumns = ({
  clientConfig,
  collectionConfig,
  collectionSlug,
  columns,
  i18n,
}: {
  clientConfig: ClientConfig
  collectionConfig?: ClientCollectionConfig
  collectionSlug: string | string[]
  columns: ColumnPreference[]
  i18n: I18nClient
}) => {
  const isPolymorphic = Array.isArray(collectionSlug)

  const fields = !isPolymorphic ? (collectionConfig?.fields ?? []) : []

  if (isPolymorphic) {
    for (const collection of collectionSlug) {
      const clientCollectionConfig = clientConfig.collections.find(
        (each) => each.slug === collection,
      )

      for (const field of filterFields(clientCollectionConfig.fields)) {
        if (fieldAffectsData(field)) {
          if (fields.some((each) => fieldAffectsData(each) && each.name === field.name)) {
            continue
          }
        }

        fields.push(field)
      }
    }
  }

  return columns
    ? columns?.filter((column) =>
        flattenTopLevelFields(fields, {
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
        isPolymorphic ? fields : filterFields(fields),
        collectionConfig?.admin?.useAsTitle,
        isPolymorphic ? [] : collectionConfig?.admin?.defaultColumns,
      )
}
