import type {
  ClientField,
  Column,
  Field,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedFieldsPermissions,
} from 'payload'

import { createClientCollectionConfig } from 'payload'
import { flattenTopLevelFields } from 'payload/shared'
import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server rendering must use the client bundle boundary
import { DocumentIcon, Link, Table, Thumbnail } from '../../exports/client/index.js'
import { filterFieldsWithPermissions } from '../../providers/TableColumns/buildColumnState/filterFieldsWithPermissions.js'
import { renderCell } from '../../providers/TableColumns/buildColumnState/renderCell.js'
import { resolveDocumentListItemURL } from '../../views/List/resolveDocumentListItemURL.js'

/** Render a consistent document summary using the collection's permitted cell renderers. */
export function renderCollectionPreviewTable({
  collection,
  docs,
  fieldPermissions,
  label,
  req,
  thumbnailURLs,
}: {
  collection: SanitizedCollectionConfig
  docs: ({ id: number | string } & Record<string, unknown>)[]
  fieldPermissions?: SanitizedFieldsPermissions
  label: string
  req: PayloadRequest
  thumbnailURLs: ReadonlyMap<unknown, string | undefined>
}) {
  const { i18n, payload } = req
  const clientCollection = createClientCollectionConfig({
    collection,
    defaultIDType: payload.config.db.defaultIDType,
    i18n,
    importMap: payload.importMap,
  })
  const clientFields = getPreviewFields({ fieldPermissions, fields: clientCollection.fields, req })
  const serverFields = getPreviewFields({ fieldPermissions, fields: collection.fields, req })
  const definitions = [
    {
      accessor: 'title',
      fieldName: collection.admin.useAsTitle || 'id',
      Heading: i18n.t('dashboard:widgetTitleLabel'),
    },
    { accessor: 'updatedAt', fieldName: 'updatedAt', Heading: i18n.t('general:updatedAt') },
    { accessor: 'updatedBy', fieldName: 'updatedBy', Heading: i18n.t('general:updatedBy') },
    { accessor: 'createdBy', fieldName: 'createdBy', Heading: i18n.t('general:createdBy') },
  ]
  const columns: Column[] = definitions.map(({ accessor, fieldName, Heading }, columnIndex) => {
    const clientField = clientFields.find((field) => 'name' in field && field.name === fieldName)
    const serverField = serverFields.find((field) => 'name' in field && field.name === fieldName)
    const isTitle = columnIndex === 0

    return {
      accessor,
      active: true,
      field: clientField ?? { name: accessor, type: 'ui', admin: {} },
      Heading,
      isLinkedColumn: isTitle,
      renderedCells: docs.map((doc, rowIndex) => {
        const cell =
          clientField && serverField
            ? renderCell({
                clientField,
                collectionSlug: collection.slug,
                columnIndex,
                customCellProps: undefined,
                doc,
                enableRowSelections: false,
                i18n,
                isLinkedColumn: isTitle,
                payload,
                req,
                rowIndex,
                serverField,
                viewType: 'list',
              })
            : isTitle
              ? renderIDTitle({ collection, doc, req })
              : null

        return isTitle ? (
          <React.Fragment key={doc.id}>
            <span aria-hidden="true" className="collection-preview__table-thumbnail">
              <Thumbnail
                doc={{ filename: '' }}
                fileSrc={thumbnailURLs.get(doc.id)}
                placeholder={<DocumentIcon />}
                size="none"
              />
            </span>
            {cell}
          </React.Fragment>
        ) : (
          cell
        )
      }),
    }
  })

  return (
    <Table
      ariaLabel={label}
      columns={columns}
      data={docs}
      id={`payload-table-${collection.slug}`}
      shouldScopeHeadingIDs
    />
  )
}

function getPreviewFields<T extends ClientField | Field>({
  fieldPermissions,
  fields,
  req,
}: {
  fieldPermissions?: SanitizedFieldsPermissions
  fields: T[]
  req: PayloadRequest
}): T[] {
  // Authorship is hidden in edit forms, but explicitly included in the widget summary.
  const previewFields = fields.map((field) =>
    'name' in field && (field.name === 'updatedBy' || field.name === 'createdBy')
      ? { ...field, admin: { ...field.admin, hidden: false } }
      : field,
  )

  return flattenTopLevelFields(
    filterFieldsWithPermissions<T>({
      fieldPermissions: fieldPermissions ?? true,
      fields: previewFields,
    }),
    { i18n: req.i18n, keepPresentationalFields: true, moveSubFieldsToTop: true },
  ) as T[]
}

function renderIDTitle({
  collection,
  doc,
  req,
}: {
  collection: SanitizedCollectionConfig
  doc: { id: number | string } & Record<string, unknown>
  req: PayloadRequest
}) {
  const href = resolveDocumentListItemURL({
    collectionSlug: collection.slug,
    doc,
    formatDocURL: collection.admin.formatDocURL,
    req,
    viewType: 'list',
  })

  return href ? <Link href={href}>{doc.id}</Link> : <span>{doc.id}</span>
}
