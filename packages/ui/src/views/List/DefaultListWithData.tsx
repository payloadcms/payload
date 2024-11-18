import React from 'react'

import type { DefaultListViewProps, ListComponentServerProps } from './types.js'

import { ListQueryProvider } from '../../providers/ListQuery/index.js'
import { renderTable } from '../../utilities/renderTable.js'
import { DefaultListView } from './index.js'

type Args = ListComponentServerProps & Omit<DefaultListViewProps, 'data' | 'Table'>
export async function DefaultListViewWithData(args: Args) {
  const {
    clientCollectionConfig,
    customCellProps,
    drawerSlug,
    fields,
    i18n,
    limit,
    listPreferences,
    locale,
    page,
    payload,
    sort,
    user,
    whereQuery,
  } = args

  const data = await payload.find({
    collection: args.collectionSlug,
    depth: 0,
    draft: true,
    fallbackLocale: false,
    includeLockStatus: true,
    limit,
    locale: locale?.code,
    overrideAccess: false,
    page,
    sort,
    user,
    where: whereQuery || {},
  })

  const { columnState, Table } = renderTable({
    collectionConfig: clientCollectionConfig,
    columnPreferences: listPreferences?.columns,
    customCellProps,
    docs: data.docs,
    drawerSlug,
    enableRowSelections: args.enableRowSelections,
    fields,
    i18n,
    payload,
  })

  const clientProps: Required<
    Omit<DefaultListViewProps, 'children' | 'getTableState' | 'onQueryChange'>
  > = {
    AfterList: args.AfterList,
    AfterListTable: args.AfterListTable,
    beforeActions: args.beforeActions,
    BeforeList: args.BeforeList,
    BeforeListTable: args.BeforeListTable,
    collectionSlug: args.collectionSlug,
    columnState,
    Description: args.Description,
    disableBulkDelete: args.disableBulkDelete,
    disableBulkEdit: args.disableBulkEdit,
    enableRowSelections: args.enableRowSelections,
    hasCreatePermission: args.hasCreatePermission,
    listPreferences: args.listPreferences,
    newDocumentURL: args.newDocumentURL,
    preferenceKey: args.preferenceKey,
    renderedFilters: args.renderedFilters,
    Table,
  }

  const reducedClientProps = Object.keys(clientProps).reduce(
    (acc, key) => {
      if (clientProps[key] !== undefined) {
        acc[key] = clientProps[key]
      }
      return acc
    },
    {} as typeof clientProps,
  )

  return (
    <ListQueryProvider
      data={data}
      defaultLimit={limit}
      defaultSort={sort}
      modifySearchParams={!drawerSlug}
      preferenceKey={args.preferenceKey}
    >
      <DefaultListView {...reducedClientProps} />
    </ListQueryProvider>
  )
}
