import React from 'react'

import type { DefaultListViewProps, ListComponentServerProps } from './types.js'

import { renderTable } from '../../utilities/renderTable.js'
import { DefaultListView } from './index.js'

type Args = ListComponentServerProps & Omit<DefaultListViewProps, 'data' | 'Table'>
export async function DefaultListViewWithData(args: Args) {
  const {
    clientCollectionConfig,
    collectionConfig,
    customCellProps,
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
    enableRowSelections: args.enableRowSelections,
    fields,
    i18n,
    payload,
    useAsTitle: collectionConfig.admin.useAsTitle,
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
    data,
    defaultLimit: limit,
    defaultSort: sort,
    Description: args.Description,
    disableBulkDelete: args.disableBulkDelete,
    disableBulkEdit: args.disableBulkEdit,
    enableRowSelections: args.enableRowSelections,
    hasCreatePermission: args.hasCreatePermission,
    listPreferences: args.listPreferences,
    modifySearchParams: args.modifySearchParams,
    newDocumentURL: args.newDocumentURL,
    preferenceKey: args.preferenceKey,
    renderedFilters: args.renderedFilters,
    Table,
  }

  return <DefaultListView {...clientProps} />
}
