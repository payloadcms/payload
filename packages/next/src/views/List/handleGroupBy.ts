import type {
  ClientConfig,
  Column,
  ListQuery,
  PaginatedDocs,
  PayloadRequest,
  SanitizedCollectionConfig,
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
  user,
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
  user: any
  where: Where
}): Promise<{
  columnState: any[]
  data: PaginatedDocs
  Table: null | React.ReactNode | React.ReactNode[]
}> => {
  let Table: React.ReactNode | React.ReactNode[] = null
  let columnState: Column[] = []

  const dataByGroup: Record<string, PaginatedDocs> = {}
  const clientCollectionConfig = clientConfig.collections.find((c) => c.slug === collectionSlug)

  // NOTE: is there a faster/better way to do this?
  const flattenedFields = flattenAllFields({ fields: collectionConfig.fields })

  const groupByFieldName = query.groupBy.replace(/^-/, '')

  const groupByField = flattenedFields.find((f) => f.name === groupByFieldName)

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
    field: groupByFieldName,
    limit: query?.limit ? Number(query.limit) : undefined,
    locale: req.locale,
    overrideAccess: false,
    page: query?.page ? Number(query.page) : undefined,
    populate,
    req,
    sort: query?.groupBy,
  })

  const data = {
    ...distinct,
    docs: distinct.values?.map(() => ({})) || [],
    values: undefined,
  }

  if (distinct.values) {
    await Promise.all(
      distinct.values.map(async (distinctValue, i) => {
        const potentiallyPopulatedRelationship = distinctValue[groupByFieldName]

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
          user,
          where: {
            ...(whereWithMergedSearch || {}),
            [groupByFieldName]: {
              equals: valueOrRelationshipID,
            },
          },
        })

        let heading = valueOrRelationshipID || 'No value'

        if (
          groupByField?.type === 'relationship' &&
          typeof potentiallyPopulatedRelationship === 'object'
        ) {
          heading =
            potentiallyPopulatedRelationship[relationshipConfig.admin.useAsTitle || 'id'] ||
            valueOrRelationshipID
        }

        if (groupByField.type === 'date') {
          heading = formatDate({
            date: String(heading),
            i18n: req.i18n,
            pattern: clientConfig.admin.dateFormat,
          })
        }

        const { columnState: newColumnState, Table: NewTable } = renderTable({
          clientCollectionConfig,
          collectionConfig,
          columns,
          customCellProps,
          data: groupData,
          drawerSlug,
          enableRowSelections,
          groupByValue: valueOrRelationshipID,
          heading,
          i18n: req.i18n,
          key: `table-${valueOrRelationshipID}`,
          orderableFieldName: collectionConfig.orderable === true ? '_order' : undefined,
          payload: req.payload,
          useAsTitle: collectionConfig.admin.useAsTitle,
        })

        if (!Table) {
          Table = []
        }

        dataByGroup[valueOrRelationshipID] = groupData
        ;(Table as Array<React.ReactNode>)[i] = NewTable
      }),
    )

    // Need to run an initial `buildColumnState` here because we need column state for _all_ tables
    // This will build the columns that apply to _all_ tables, like which are available, which are on/off, and their orders
    // For now, just call `renderTable` and don't use the returned `Table`, only the `columnState`
    // TODO: can we just use the first columnState for this?
    ;({ columnState } = renderTable({
      clientCollectionConfig,
      collectionConfig,
      columns,
      customCellProps,
      data,
      drawerSlug,
      enableRowSelections,
      i18n: req.i18n,
      orderableFieldName: collectionConfig.orderable === true ? '_order' : undefined,
      payload: req.payload,
      useAsTitle: collectionConfig.admin.useAsTitle,
    }))
  }

  return {
    columnState,
    data,
    Table,
  }
}
