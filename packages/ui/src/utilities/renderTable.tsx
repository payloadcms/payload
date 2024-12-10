import { getTranslation, type I18nClient } from '@payloadcms/translations'
import {
  type ClientCollectionConfig,
  type CollectionConfig,
  type Field,
  type ImportMap,
  type PaginatedDocs,
  type Payload,
  type SanitizedCollectionConfig,
} from 'payload'
import { fieldIsHiddenOrDisabled, flattenTopLevelFields } from 'payload/shared'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import type { Column } from '../exports/client/index.js'
import type { ColumnPreferences } from '../providers/ListQuery/index.js'

import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import { buildColumnState } from '../elements/TableColumns/buildColumnState.js'
import { filterFields } from '../elements/TableColumns/filterFields.js'
import { getInitialColumns } from '../elements/TableColumns/getInitialColumns.js'
// eslint-disable-next-line payload/no-imports-from-exports-dir
import { Pill, Table } from '../exports/client/index.js'

export const renderFilters = (
  fields: Field[],
  importMap: ImportMap,
): Map<string, React.ReactNode> =>
  fields.reduce(
    (acc, field) => {
      if (fieldIsHiddenOrDisabled(field)) {
        return acc
      }

      if ('name' in field && field.admin?.components?.Filter) {
        acc.set(
          field.name,
          RenderServerComponent({
            Component: field.admin.components?.Filter,
            importMap,
          }),
        )
      }

      return acc
    },
    new Map() as Map<string, React.ReactNode>,
  )

export const renderTable = ({
  clientCollectionConfig,
  collectionConfig,
  columnPreferences,
  columns: columnsFromArgs,
  customCellProps,
  docs,
  enableRowSelections,
  i18n,
  payload,
  renderRowTypes,
  tableAppearance,
  useAsTitle,
}: {
  clientCollectionConfig: ClientCollectionConfig
  collectionConfig: SanitizedCollectionConfig
  columnPreferences: ColumnPreferences
  columns?: ColumnPreferences
  customCellProps?: Record<string, any>
  docs: PaginatedDocs['docs']
  drawerSlug?: string
  enableRowSelections: boolean
  i18n: I18nClient
  payload: Payload
  renderRowTypes?: boolean
  tableAppearance?: 'condensed' | 'default'
  useAsTitle: CollectionConfig['admin']['useAsTitle']
}): {
  columnState: Column[]
  Table: React.ReactNode
} => {
  // Ensure that columns passed as args comply with the field config, i.e. `hidden`, `disableListColumn`, etc.
  const columns = columnsFromArgs
    ? columnsFromArgs?.filter((column) =>
        flattenTopLevelFields(clientCollectionConfig.fields, true)?.some(
          (field) => 'name' in field && field.name === column.accessor,
        ),
      )
    : getInitialColumns(
        filterFields(clientCollectionConfig.fields),
        useAsTitle,
        clientCollectionConfig?.admin?.defaultColumns,
      )

  const columnState = buildColumnState({
    beforeRows: renderRowTypes
      ? [
          {
            accessor: 'collection',
            active: true,
            field: null,
            Heading: i18n.t('version:type'),
            renderedCells: docs.map((_, i) => (
              <Pill key={i}>{getTranslation(clientCollectionConfig.labels.singular, i18n)}</Pill>
            )),
          },
        ]
      : undefined,
    clientCollectionConfig,
    collectionConfig,
    columnPreferences,
    columns,
    enableRowSelections,
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
