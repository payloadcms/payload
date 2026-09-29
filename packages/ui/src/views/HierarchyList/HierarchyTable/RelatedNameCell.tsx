'use client'

import type { TextFieldClient } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { SlotColumn } from './SlotTable.js'
import type { TableRow } from './types.js'

import { Link } from '../../../elements/Link/index.js'
import { FileCell } from '../../../elements/Table/DefaultCell/fields/File/index.js'
import { DocumentIcon } from '../../../icons/Document/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { baseClass } from './types.js'

export const RelatedNameCell: SlotColumn<TableRow>['Cell'] = ({ row }) => {
  const {
    config: {
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug: row._collectionSlug })
  const titleField = collectionConfig?.admin?.useAsTitle || 'id'
  const rawTitle =
    typeof row[titleField] === 'string' || typeof row[titleField] === 'number'
      ? row[titleField]
      : row.id
  const title = typeof rawTitle === 'object' ? JSON.stringify(rawTitle) : String(rawTitle)

  const editUrl = formatAdminURL({
    adminRoute,
    path: `/collections/${row._collectionSlug}/${row.id}`,
  })

  // Upload collections delegate to the list view's file cell, so thumbnail resolution and styling
  // stay in one place. Everything else gets a generic document icon.
  const filenameField = collectionConfig?.upload
    ? collectionConfig.fields.find((field) => 'name' in field && field.name === 'filename')
    : undefined

  const fileCellProps = filenameField
    ? {
        collectionConfig,
        field: filenameField as TextFieldClient,
        rowData: row,
      }
    : undefined

  return (
    <Link className={`${baseClass}__name-link cell-link`} href={editUrl}>
      {fileCellProps ? (
        <FileCell
          cellData={title}
          collectionSlug={fileCellProps.collectionConfig.slug}
          {...fileCellProps}
        />
      ) : (
        <>
          <span className={`${baseClass}__name-icon`}>
            <DocumentIcon />
          </span>
          <span className={`${baseClass}__name-text`}>{title}</span>
        </>
      )}
    </Link>
  )
}
