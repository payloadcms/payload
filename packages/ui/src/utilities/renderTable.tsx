import type { ClientField, CollectionConfig, Field, ImportMap, PaginatedDocs } from 'payload'

import type { ColumnPreferences } from '../providers/ListInfo/index.js'

import { Table } from '../elements/Table/index.js'
import { buildColumnState } from '../elements/TableColumns/buildColumnState.js'
import { filterFields } from '../elements/TableColumns/filterFields.js'
import { getInitialColumns } from '../elements/TableColumns/getInitialColumns.js'

export const renderTable = ({
  clientFields,
  columnPreferences,
  data,
  defaultColumns,
  enableRowSelections,
  fields,
  importMap,
  useAsTitle,
  collectionSlug,
}: {
  clientFields: ClientField[]
  collectionSlug: string
  columnPreferences: ColumnPreferences
  data: PaginatedDocs
  defaultColumns: CollectionConfig['admin']['defaultColumns']
  enableRowSelections: boolean
  fields: Field[]
  importMap: ImportMap
  useAsTitle: CollectionConfig['admin']['useAsTitle']
}) => {
  const initialColumns = getInitialColumns(filterFields(fields), useAsTitle, defaultColumns)

  const columnState = buildColumnState({
    // beforeRows,
    clientFields,
    collectionSlug,
    columnPreferences,
    columns: initialColumns,
    enableRowSelections,
    fields,
    // sortColumnProps,
    docs: data.docs,
    importMap,
    useAsTitle,
  })

  return <Table columns={columnState} data={data.docs} />
}
