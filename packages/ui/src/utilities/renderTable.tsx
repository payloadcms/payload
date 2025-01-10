import type {
  ClientCollectionConfig,
  CollectionConfig,
  Field,
  ImportMap,
  ListPreferences,
  PaginatedDocs,
  Payload,
  SanitizedCollectionConfig,
} from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import { fieldIsHiddenOrDisabled, flattenTopLevelFields } from 'payload/shared'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import type { Column } from '../exports/client/index.js'

import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import { buildColumnState } from '../elements/TableColumns/buildColumnState.js'
import { filterFields } from '../elements/TableColumns/filterFields.js'
import { getInitialColumns } from '../elements/TableColumns/getInitialColumns.js'
// eslint-disable-next-line payload/no-imports-from-exports-dir
import { Pill, SelectAll, SelectRow, Table } from '../exports/client/index.js'

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
  columnPreferences: ListPreferences['columns']
  columns?: ListPreferences['columns']
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

  const columnsToUse = [...columnState]

  if (renderRowTypes) {
    columnsToUse.unshift({
      accessor: 'collection',
      active: true,
      field: {
        admin: {
          disabled: true,
        },
        hidden: true,
      },
      Heading: i18n.t('version:type'),
      renderedCells: docs.map((_, i) => (
        <Pill key={i}>{getTranslation(clientCollectionConfig.labels.singular, i18n)}</Pill>
      )),
    } as Column)
  }

  if (enableRowSelections) {
    columnsToUse.unshift({
      accessor: '_select',
      active: true,
      field: {
        admin: {
          disabled: true,
        },
        hidden: true,
      },
      Heading: <SelectAll />,
      renderedCells: docs.map((_, i) => <SelectRow key={i} rowData={docs[i]} />),
    } as Column)
  }

  return {
    columnState,
    Table: <Table appearance={tableAppearance} columns={columnsToUse} data={docs} />,
  }
}
