import type { ClientField, CollectionConfig, Field, ImportMap, PaginatedDocs } from 'payload'

import type { Column } from '../elements/Table/index.js'
import type { ColumnPreferences } from '../providers/ListInfo/index.js'

import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import { Table } from '../elements/Table/index.js'
import { buildColumnState } from '../elements/TableColumns/buildColumnState.js'

export const renderFilters = (
  fields: Field[],
  importMap: ImportMap,
): Map<string, React.ReactNode> =>
  fields.reduce(
    (acc, field) => {
      if ('name' in field && field.admin?.components?.Filter) {
        acc.set(
          field.name,
          <RenderServerComponent
            Component={field.admin.components?.Filter}
            importMap={importMap}
          />,
        )
      }

      return acc
    },
    new Map() as Map<string, React.ReactNode>,
  )

export const renderTable = ({
  clientFields,
  collectionSlug,
  columnPreferences,
  columns,
  docs,
  drawerSlug,
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
  drawerSlug?: string
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
    drawerSlug,
    importMap,
    useAsTitle,
  })

  return {
    columnState,
    Table: <Table columns={columnState} data={docs} />,
  }
}
