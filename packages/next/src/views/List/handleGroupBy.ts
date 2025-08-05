import type {
  ClientConfig,
  Column,
  ListQuery,
  PaginatedDocs,
  PayloadRequest,
  SanitizedCollectionConfig,
  ViewTypes,
  Where,
} from 'payload'

import { renderTable } from '@payloadcms/ui/rsc'
import { formatDate } from '@payloadcms/ui/shared'
import { flattenAllFields } from 'payload'

export const handleGroupBy = async ({
  clientConfig,
  collectionConfig,
  collectionSlug,
  columns,
  customCellProps,
  drawerSlug,
  enableRowSelections,
  query,
  req,
  trash = false,
  user,
  viewType,
  where: whereWithMergedSearch,
}: {
  clientConfig: ClientConfig
  collectionConfig: SanitizedCollectionConfig
  collectionSlug: string
  columns: any[]
  customCellProps?: Record<string, any>
  drawerSlug?: string
  enableRowSelections?: boolean
  query?: ListQuery
  req: PayloadRequest
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
  const clientCollectionConfig = clientConfig.collections.find((c) => c.slug === collectionSlug)

  // NOTE: is there a faster/better way to do this?
  const flattenedFields = flattenAllFields({ fields: collectionConfig.fields })

  const groupByFieldPath = query.groupBy.replace(/^-/, '')

  const groupByField = flattenedFields.find((f) => f.name === groupByFieldPath)

  const relationshipConfig =
    groupByField?.type === 'relationship'
      ? clientConfig.collections.find((c) => c.slug === groupByField.relationTo)
      : undefined

  let populate

  if (groupByField?.type === 'relationship' && groupByField.relationTo) {
    const relationTo =
      typeof groupByField.relationTo === 'string'
        ? [groupByField.relationTo]
        : groupByField.relationTo

    if (Array.isArray(relationTo)) {
      relationTo.forEach((rel) => {
        if (!populate) {
          populate = {}
        }
        populate[rel] = { [relationshipConfig?.admin.useAsTitle || 'id']: true }
      })
    }
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
    distinct.values.map(async (distinctValue, i) => {
      const potentiallyPopulatedRelationship = distinctValue[groupByFieldPath]

      const valueOrRelationshipID =
        groupByField?.type === 'relationship' &&
        potentiallyPopulatedRelationship &&
        typeof potentiallyPopulatedRelationship === 'object' &&
        'id' in potentiallyPopulatedRelationship
          ? potentiallyPopulatedRelationship.id
          : potentiallyPopulatedRelationship

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

      let heading = valueOrRelationshipID

      if (
        groupByField?.type === 'relationship' &&
        potentiallyPopulatedRelationship &&
        typeof potentiallyPopulatedRelationship === 'object'
      ) {
        heading =
          potentiallyPopulatedRelationship[relationshipConfig.admin.useAsTitle || 'id'] ||
          valueOrRelationshipID
      }

      if (groupByField.type === 'date' && valueOrRelationshipID) {
        heading = formatDate({
          date: String(valueOrRelationshipID),
          i18n: req.i18n,
          pattern: clientConfig.admin.dateFormat,
        })
      }

      if (groupByField.type === 'checkbox') {
        if (valueOrRelationshipID === true) {
          heading = req.i18n.t('general:true')
        }

        if (valueOrRelationshipID === false) {
          heading = req.i18n.t('general:false')
        }
      }

      if (groupData.docs && groupData.docs.length > 0) {
        const { columnState: newColumnState, Table: NewTable } = renderTable({
          clientCollectionConfig,
          collectionConfig,
          columns,
          customCellProps,
          data: groupData,
          drawerSlug,
          enableRowSelections,
          groupByFieldPath,
          groupByValue: valueOrRelationshipID,
          heading: heading || req.i18n.t('general:noValue'),
          i18n: req.i18n,
          key: `table-${valueOrRelationshipID}`,
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

        dataByGroup[valueOrRelationshipID] = groupData
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
