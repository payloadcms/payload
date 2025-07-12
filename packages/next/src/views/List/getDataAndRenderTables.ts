import type {
  ClientConfig,
  CollectionPreferences,
  Column,
  ListQuery,
  PaginatedDocs,
  PayloadRequest,
  SanitizedCollectionConfig,
} from 'payload'

import { renderTable } from '@payloadcms/ui/rsc'
import { flattenAllFields } from 'payload'

export const getDataAndRenderTables = async ({
  clientConfig,
  collectionConfig,
  collectionPreferences,
  collectionSlug,
  columns,
  customCellProps,
  drawerSlug,
  enableRowSelections,
  query,
  req,
  user,
}: {
  clientConfig: ClientConfig
  collectionConfig: SanitizedCollectionConfig
  collectionPreferences?: CollectionPreferences
  collectionSlug: string
  columns: any[]
  customCellProps?: Record<string, any>
  drawerSlug?: string
  enableRowSelections?: boolean
  query?: ListQuery
  req: PayloadRequest
  user: any
}): Promise<{
  columnState: any[]
  data: PaginatedDocs
  /**
   * Data by group is returned when `groupBy` is defined.
   */
  dataByGroup?: Record<string, PaginatedDocs>
  Table: React.ReactNode | React.ReactNode[]
}> => {
  let data
  const dataByGroup: Record<string, PaginatedDocs> = {}
  let Table: React.ReactNode | React.ReactNode[] = null
  let columnState: Column[] = []

  const clientCollectionConfig = clientConfig.collections.find((c) => c.slug === collectionSlug)

  if (query.groupBy) {
    const distinct = await req.payload.findDistinct({
      collection: collectionSlug,
      depth: 1,
      field: query.groupBy,
      limit: query?.limit ? Number(query.limit) : undefined,
      locale: req.locale,
      overrideAccess: false,
      page: query?.page ? Number(query.page) : undefined,
      req,
      // where: where || {},
    })

    data = {
      ...distinct,
      docs: distinct.values?.map(() => ({})) || [],
      values: undefined,
    }

    if (distinct.values) {
      // NOTE: is there a faster/better way to do this?
      const flattenedFields = flattenAllFields({ fields: collectionConfig.fields })
      const groupByField = flattenedFields.find((f) => f.name === query.groupBy)
      const isRelationship = groupByField?.type === 'relationship'

      const relationshipConfig = isRelationship
        ? clientConfig.collections.find((c) => c.slug === groupByField.relationTo)
        : undefined

      await Promise.all(
        distinct.values.map(async (distinctValue, i) => {
          const potentiallyPopulatedRelationship = distinctValue[query.groupBy]

          const valueOrRelationshipID =
            isRelationship &&
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
            sort: query?.queryByGroup?.[valueOrRelationshipID]?.sort,
            user,
            where: {
              ...(query?.where || {}),
              [query.groupBy]: {
                equals: valueOrRelationshipID,
              },
            },
          })

          const { columnState: newColumnState, Table: NewTable } = renderTable({
            clientCollectionConfig,
            collectionConfig,
            columnPreferences: collectionPreferences?.columns,
            columns,
            customCellProps,
            data: groupData,
            drawerSlug,
            enableRowSelections,
            groupByValue: valueOrRelationshipID,
            heading:
              isRelationship && typeof potentiallyPopulatedRelationship === 'object'
                ? potentiallyPopulatedRelationship[relationshipConfig.admin.useAsTitle || 'id'] ||
                  valueOrRelationshipID
                : potentiallyPopulatedRelationship || 'Untitled',
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
        columnPreferences: collectionPreferences?.columns,
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
  } else {
    data = await req.payload.find({
      collection: collectionSlug,
      depth: 0,
      draft: true,
      fallbackLocale: false,
      includeLockStatus: true,
      limit: query?.limit ? Number(query.limit) : undefined,
      locale: req.locale,
      overrideAccess: false,
      page: query?.page ? Number(query.page) : undefined,
      req,
      sort: query?.sort,
      user,
      where: query?.where || {},
    })
    ;({ columnState, Table } = renderTable({
      clientCollectionConfig,
      collectionConfig,
      columnPreferences: collectionPreferences?.columns,
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
