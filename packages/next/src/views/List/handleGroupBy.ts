import type {
  ClientCollectionConfig,
  ClientConfig,
  Column,
  ListQuery,
  PaginatedDocs,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedFieldsPermissions,
  SelectType,
  ViewTypes,
  Where,
} from '@ruya.sa/payload'

import { renderTable } from '@ruya.sa/ui/rsc'
import { formatDate } from '@ruya.sa/ui/shared'
import { flattenAllFields } from '@ruya.sa/payload'

import { createSerializableValue } from './createSerializableValue.js'
import { extractRelationshipDisplayValue } from './extractRelationshipDisplayValue.js'
import { extractValueOrRelationshipID } from './extractValueOrRelationshipID.js'

export const handleGroupBy = async ({
  clientCollectionConfig,
  clientConfig,
  collectionConfig,
  collectionSlug,
  columns,
  customCellProps,
  drawerSlug,
  enableRowSelections,
  fieldPermissions,
  query,
  req,
  select,
  trash = false,
  user,
  viewType,
  where: whereWithMergedSearch,
}: {
  clientCollectionConfig: ClientCollectionConfig
  clientConfig: ClientConfig
  collectionConfig: SanitizedCollectionConfig
  collectionSlug: string
  columns: any[]
  customCellProps?: Record<string, any>
  drawerSlug?: string
  enableRowSelections?: boolean
  fieldPermissions?: SanitizedFieldsPermissions
  query?: ListQuery
  req: PayloadRequest
  select?: SelectType
  trash?: boolean
  user: any
  viewType?: ViewTypes
  where: Where
}): Promise<{
  columnState: Column[]
  data: PaginatedDocs
  Table: null | React.ReactNode | React.ReactNode[]
}> => {
  let Table: React.ReactNode | React.ReactNode[] = null
  let columnState: Column[]

  const dataByGroup: Record<string, PaginatedDocs> = {}

  // NOTE: is there a faster/better way to do this?
  const flattenedFields = flattenAllFields({ fields: collectionConfig.fields })

  const groupByFieldPath = query.groupBy.replace(/^-/, '')

  const groupByField = flattenedFields.find((f) => f.name === groupByFieldPath)

  // Set up population for relationships
  let populate

  if (groupByField?.type === 'relationship' && groupByField.relationTo) {
    const relationTo = Array.isArray(groupByField.relationTo)
      ? groupByField.relationTo
      : [groupByField.relationTo]

    populate = {}
    relationTo.forEach((rel) => {
      const config = clientConfig.collections.find((c) => c.slug === rel)
      populate[rel] = { [config?.admin?.useAsTitle || 'id']: true }
    })
  }

  const distinct = await req.payload.findDistinct({
    collection: collectionSlug,
    depth: 1,
    field: groupByFieldPath,
    limit: query?.limit ? Number(query.limit) : undefined,
    locale: req.locale,
    overrideAccess: false,
    page: query?.page ? Number(query.page) : undefined,
    populate,
    req,
    sort: query?.groupBy,
    trash,
    where: whereWithMergedSearch,
  })

  const data = {
    ...distinct,
    docs: distinct.values?.map(() => ({})) || [],
    values: undefined,
  }

  await Promise.all(
    (distinct.values || []).map(async (distinctValue, i) => {
      const potentiallyPopulatedRelationship = distinctValue[groupByFieldPath]

      // Extract value or relationship ID for database query
      const valueOrRelationshipID = extractValueOrRelationshipID(potentiallyPopulatedRelationship)

      const groupData = await req.payload.find({
        collection: collectionSlug,
        depth: 0,
        draft: true,
        fallbackLocale: false,
        includeLockStatus: true,
        limit: query?.queryByGroup?.[valueOrRelationshipID]?.limit
          ? Number(query.queryByGroup[valueOrRelationshipID].limit)
          : undefined,
        locale: req.locale,
        overrideAccess: false,
        page: query?.queryByGroup?.[valueOrRelationshipID]?.page
          ? Number(query.queryByGroup[valueOrRelationshipID].page)
          : undefined,
        req,
        // Note: if we wanted to enable table-by-table sorting, we could use this:
        // sort: query?.queryByGroup?.[valueOrRelationshipID]?.sort,
        select,
        sort: query?.sort,
        trash,
        user,
        where: {
          ...(whereWithMergedSearch || {}),
          [groupByFieldPath]: {
            equals: valueOrRelationshipID,
          },
        },
      })

      // Extract heading
      let heading: string

      if (potentiallyPopulatedRelationship === null) {
        heading = req.i18n.t('general:noValue')
      } else if (groupByField?.type === 'relationship') {
        const relationshipConfig = Array.isArray(groupByField.relationTo)
          ? undefined
          : clientConfig.collections.find((c) => c.slug === groupByField.relationTo)
        heading = extractRelationshipDisplayValue(
          potentiallyPopulatedRelationship,
          clientConfig,
          relationshipConfig,
        )
      } else if (groupByField?.type === 'date') {
        heading = formatDate({
          date: String(valueOrRelationshipID),
          i18n: req.i18n,
          pattern: clientConfig.admin.dateFormat,
        })
      } else if (groupByField?.type === 'checkbox') {
        if (valueOrRelationshipID === true) {
          heading = req.i18n.t('general:true')
        }
        if (valueOrRelationshipID === false) {
          heading = req.i18n.t('general:false')
        }
      } else {
        heading = String(valueOrRelationshipID)
      }

      // Create serializable value for client
      const serializableValue = createSerializableValue(valueOrRelationshipID)

      if (groupData.docs && groupData.docs.length > 0) {
        const { columnState: newColumnState, Table: NewTable } = renderTable({
          clientCollectionConfig,
          collectionConfig,
          columns,
          customCellProps,
          data: groupData,
          drawerSlug,
          enableRowSelections,
          fieldPermissions,
          groupByFieldPath,
          groupByValue: serializableValue,
          heading: heading || req.i18n.t('general:noValue'),
          i18n: req.i18n,
          key: `table-${serializableValue}`,
          orderableFieldName: collectionConfig.orderable === true ? '_order' : undefined,
          payload: req.payload,
          query,
          useAsTitle: collectionConfig.admin.useAsTitle,
          viewType,
        })

        // Only need to set `columnState` once, using the first table's column state
        // This will avoid needing to generate column state explicitly for root context that wraps all tables
        if (!columnState) {
          columnState = newColumnState
        }

        if (!Table) {
          Table = []
        }

        dataByGroup[serializableValue] = groupData
        ;(Table as Array<React.ReactNode>)[i] = NewTable
      }
    }),
  )

  return {
    columnState,
    data,
    Table,
  }
}
