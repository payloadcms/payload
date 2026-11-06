import type {
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedFieldsPermissions,
  StaticLabel,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { createClientCollectionConfig } from 'payload'
import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server rendering must use the client bundle boundary
import { Table } from '../../exports/client/index.js'
import { filterFieldsWithPermissions } from '../../providers/TableColumns/buildColumnState/filterFieldsWithPermissions.js'
import { buildColumnState } from '../../providers/TableColumns/buildColumnState/index.js'
import { getInitialColumns } from '../../providers/TableColumns/getInitialColumns.js'

/** Use the collection list's columns and cell renderers for the dashboard preview. */
export function renderCollectionPreviewTable({
  collection,
  docs,
  fieldPermissions,
  label,
  req,
}: {
  collection: SanitizedCollectionConfig
  docs: Record<string, unknown>[]
  fieldPermissions?: SanitizedFieldsPermissions
  label: string
  req: PayloadRequest
}) {
  const { i18n, payload } = req
  const clientCollection = createClientCollectionConfig({
    collection,
    defaultIDType: payload.config.db.defaultIDType,
    i18n,
    importMap: payload.importMap,
  })
  const { useAsTitle: titleField } = collection.admin
  const columns = getInitialColumns(
    filterFieldsWithPermissions({
      fieldPermissions: fieldPermissions ?? true,
      fields: clientCollection.fields,
    }),
    titleField,
    collection.admin.defaultColumns,
  )
  const columnState = buildColumnState({
    clientFields: clientCollection.fields,
    collectionSlug: collection.slug,
    columns,
    customCellProps: undefined,
    dataType: 'monomorphic',
    docs,
    enableRowSelections: false,
    fieldPermissions: fieldPermissions ?? true,
    i18n,
    payload,
    req,
    serverFields: collection.fields,
    useAsTitle: titleField,
    viewType: 'list',
  })

  // Preview headers are labels: sorting the collection is available in its full list view.
  const previewColumns = columnState
    .filter(({ active }) => active)
    .map((column) => ({
      ...column,
      Heading:
        column.CustomLabel ??
        getTranslation(
          (('labelWithPrefix' in column.field
            ? column.field.labelWithPrefix
            : 'label' in column.field
              ? column.field.label
              : column.accessor) ?? column.accessor) as StaticLabel,
          i18n,
        ),
    }))

  return (
    <Table
      ariaLabel={label}
      columns={previewColumns}
      data={docs}
      id={`payload-table-${collection.slug}`}
      shouldScopeHeadingIDs
    />
  )
}
