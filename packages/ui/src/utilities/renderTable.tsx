import type { ClientField, CollectionConfig, ImportMap, PaginatedDocs } from 'payload'

import type { ColumnPreferences } from '../providers/ListInfo/index.js'

import { Table } from '../elements/Table/index.js'
import { buildColumnState } from '../elements/TableColumns/buildColumnState.js'
import { filterFields } from '../elements/TableColumns/filterFields.js'
import { getInitialColumns } from '../elements/TableColumns/getInitialColumns.js'

export const renderTable = ({
  columnPreferences,
  data,
  defaultColumns,
  enableRowSelections,
  fields,
  importMap,
  useAsTitle,
}: {
  columnPreferences: ColumnPreferences
  data: PaginatedDocs
  defaultColumns: CollectionConfig['admin']['defaultColumns']
  enableRowSelections: boolean
  fields: ClientField[]
  importMap: ImportMap
  useAsTitle: CollectionConfig['admin']['useAsTitle']
}) => {
  const initialColumns = getInitialColumns(filterFields(fields), useAsTitle, defaultColumns)

  const columnState = buildColumnState({
    // beforeRows,
    columnPreferences,
    columns: initialColumns,
    enableRowSelections,
    fields,
    // sortColumnProps,
    importMap,
    useAsTitle,
  })

  return <Table columns={columnState} data={data.docs} />
}
