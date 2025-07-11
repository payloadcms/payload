import type {
  ClientConfig,
  CollectionPreferences,
  Column,
  PaginatedDocs,
  PayloadRequest,
  SanitizedCollectionConfig,
} from 'payload'

import { renderTable } from '@payloadcms/ui/rsc'

export const getDataAndRenderTables = async ({
  clientConfig,
  collectionConfig,
  collectionPreferences,
  collectionSlug,
  columns,
  customCellProps,
  drawerSlug,
  enableRowSelections,
  groupBy,
  limit = 25,
  page = 1,
  req,
  sort = [],
  user,
  where = {},
}: {
  clientConfig: ClientConfig
  collectionConfig: SanitizedCollectionConfig
  collectionPreferences?: CollectionPreferences
  collectionSlug: string
  columns: any[]
  customCellProps?: Record<string, any>
  drawerSlug?: string
  enableRowSelections?: boolean
  groupBy?: string
  limit?: number
  page?: number
  req: PayloadRequest
  sort?: any[]
  user: any
  where?: Record<string, any>
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
  let Table: React.ReactNode | React.ReactNode[] = null
  let columnState: Column[] = []

  const clientCollectionConfig = clientConfig.collections.find((c) => c.slug === collectionSlug)

  if (groupBy) {
    const distinct = await req.payload.findDistinct({
      collection: collectionSlug,
      field: groupBy,
      limit,
      locale: req.locale,
      overrideAccess: false,
      // page,
      req,
      // where: where || {},
    })

    data = {
      distinct: {} as Record<string, PaginatedDocs>,
      docs: Array.from({ length: distinct.totalDocs }).map(() => ({})),
      page: distinct,
      totalPages: distinct.totalDocs,
    }

    if (distinct.values) {
      // lookup the distinct config to discover the useAsTitle
      // const distinctCollectionConfig = req.payload.config.collections.find(
      //   (c) => c.slug === 'categories',
      // )
      // TODO: replace with dynamic slug

      // const fullDistincts = await req.payload
      //   .find({
      //     collection: 'categories', // TODO
      //     depth: 0,
      //     draft: true,
      //     where: {
      //       id: {
      //         in: distinct.values,
      //       },
      //     },
      //   })
      //   ?.then((res) => res.docs)

      let allDocs = []

      await Promise.all(
        distinct.values.map(async (distinctValue) => {
          const distinctGroup = await req.payload.find({
            collection: collectionSlug,
            depth: 0,
            draft: true,
            fallbackLocale: false,
            includeLockStatus: true,
            limit,
            locale: req.locale,
            overrideAccess: false,
            page,
            req,
            sort,
            user,
            where: {
              ...where,
              [groupBy]: {
                equals: distinctValue,
              },
            },
          })

          const { columnState: newColumnState, Table: NewTable } = renderTable({
            clientCollectionConfig,
            collectionConfig,
            columnPreferences: collectionPreferences?.columns,
            columns,
            customCellProps,
            docs: distinctGroup.docs,
            drawerSlug,
            enableRowSelections,
            key: `table-${distinctValue}`,
            // TODO: return something different depending on field type, e.g. format dates, handle rich text, etc.
            heading: `${distinctValue || 'Untitled'}`,
            // TODO: for relationship fields, need to get the dynamic values
            // heading:
            //   fullDistinct?.[distinctCollectionConfig?.admin?.useAsTitle || 'id'] || 'No Category',
            i18n: req.i18n,
            orderableFieldName: collectionConfig.orderable === true ? '_order' : undefined,
            payload: req.payload,
            useAsTitle: collectionConfig.admin.useAsTitle,
          })

          if (!Table) {
            Table = []
          }

          data.distinct[distinctValue] = distinctGroup
          ;(Table as Array<React.ReactNode>).push(NewTable)
          allDocs = allDocs.concat(distinctGroup.docs)
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
        docs: allDocs,
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
      limit,
      locale: req.locale,
      overrideAccess: false,
      page,
      req,
      sort,
      user,
      where: where || {},
    })
    ;({ columnState, Table } = renderTable({
      clientCollectionConfig,
      collectionConfig,
      columnPreferences: collectionPreferences?.columns,
      columns,
      customCellProps,
      docs: data.docs,
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
