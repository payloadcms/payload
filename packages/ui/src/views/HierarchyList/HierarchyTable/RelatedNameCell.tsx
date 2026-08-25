'use client'

import type { TextFieldClient, UploadFieldClient } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React, { useMemo } from 'react'

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

  // Collections that aren't upload-enabled can still point at an upload field via
  // `admin.useAsThumbnail`. The list query populates it to a depth of 1, so the related upload doc
  // arrives on the row and can drive the same file cell.
  const relatedUpload = useMemo(() => {
    const fieldName = collectionConfig?.admin?.useAsThumbnail

    if (!fieldName || collectionConfig?.upload) {
      return undefined
    }

    const uploadField = collectionConfig.fields.find(
      (field) => 'name' in field && field.name === fieldName && field.type === 'upload',
    ) as undefined | UploadFieldClient

    if (!uploadField) {
      return undefined
    }

    // `useAsThumbnail` can point at a `hasMany` upload field, in which case the populated value is
    // an array of docs rather than a single one - use the first.
    const rawValue = row[fieldName]
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue

    if (!value || typeof value !== 'object') {
      return undefined
    }

    // Polymorphic upload fields populate as `{ relationTo, value }` rather than the doc itself.
    const isPolymorphic = 'relationTo' in value && 'value' in value
    const doc = (isPolymorphic ? value.value : value) as Record<string, unknown>
    const uploadSlug = isPolymorphic
      ? String(value.relationTo)
      : Array.isArray(uploadField.relationTo)
        ? undefined
        : uploadField.relationTo

    if (!doc || typeof doc !== 'object' || !uploadSlug) {
      return undefined
    }

    const uploadCollectionConfig = getEntityConfig({ collectionSlug: uploadSlug })

    if (!uploadCollectionConfig) {
      return undefined
    }

    return { collectionConfig: uploadCollectionConfig, doc, field: uploadField }
  }, [collectionConfig, getEntityConfig, row])

  const fileCellProps = filenameField
    ? {
        collectionConfig,
        field: filenameField as TextFieldClient,
        rowData: row,
      }
    : relatedUpload
      ? {
          collectionConfig: relatedUpload.collectionConfig,
          field: relatedUpload.field,
          rowData: relatedUpload.doc,
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
