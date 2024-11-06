import type {
  ClientCollectionConfig,
  CollectionConfig,
  Field,
  ImportMap,
  PaginatedDocs,
  Payload,
} from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'

import type { Column } from '../elements/Table/index.js'
import type { ColumnPreferences } from '../providers/ListQuery/index.js'

import { Pill } from '../elements/Pill/index.js'
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
  collectionConfig,
  columnPreferences,
  columns,
  customCellProps,
  docs,
  enableRowSelections,
  fields,
  i18n,
  payload,
  renderRowTypes,
  tableAppearance,
  useAsTitle,
}: {
  collectionConfig: ClientCollectionConfig
  columnPreferences: ColumnPreferences
  columns: ColumnPreferences
  customCellProps?: Record<string, any>
  docs: PaginatedDocs['docs']
  drawerSlug?: string
  enableRowSelections: boolean
  fields: Field[]
  i18n: I18nClient
  payload: Payload
  renderRowTypes?: boolean
  tableAppearance?: 'condensed' | 'default'
  useAsTitle: CollectionConfig['admin']['useAsTitle']
}): {
  columnState: Column[]
  Table: React.ReactNode
} => {
  const columnState = buildColumnState({
    beforeRows: renderRowTypes
      ? [
          {
            accessor: 'collection',
            active: true,
            field: null,
            Heading: i18n.t('version:type'),
            renderedCells: docs.map((_, i) => (
              <Pill key={i}>{getTranslation(collectionConfig.labels.singular, i18n)}</Pill>
            )),
          },
        ]
      : undefined,
    collectionConfig,
    columnPreferences,
    columns,
    enableRowSelections,
    fields,
    i18n,
    // sortColumnProps,
    customCellProps,
    docs,
    payload,
    useAsTitle,
  })

  return {
    columnState,
    Table: <Table appearance={tableAppearance} columns={columnState} data={docs} />,
  }
}
