import type { ClientField, CollectionConfig, Field, ImportMap, PaginatedDocs } from 'payload'

import type { Column } from '../elements/Table/index.js'
import type { ColumnPreferences } from '../providers/ListInfo/index.js'

import { Table } from '../elements/Table/index.js'
import { buildColumnState } from '../elements/TableColumns/buildColumnState.js'
export const renderTable = ({
  clientFields,
  collectionSlug,
  columnPreferences,
  columns,
  docs,
  enableRowSelections,
  fields,
  importMap,
  useAsTitle,
}: {
  clientFields: ClientField[]
  collectionSlug: string
  columnPreferences: ColumnPreferences
  columns: ColumnPreferences
  docs: PaginatedDocs['docs']
  enableRowSelections: boolean
  fields: Field[]
  importMap: ImportMap
  useAsTitle: CollectionConfig['admin']['useAsTitle']
}): {
  columnState: Column[]
  Table: React.ReactNode
} => {
  const columnState = buildColumnState({
    // beforeRows,
    clientFields,
    collectionSlug,
    columnPreferences,
    columns,
    enableRowSelections,
    fields,
    // sortColumnProps,
    docs,
    importMap,
    useAsTitle,
  })

  return {
    columnState,
    Table: <Table columns={columnState} data={docs} />,
  }
}
