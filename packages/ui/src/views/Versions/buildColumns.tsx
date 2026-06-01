import type { I18n } from '@payloadcms/translations'
import type {
  Column,
  PaginatedDocs,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TypeWithVersion,
} from 'payload'

import { hasDraftsEnabled } from 'payload/shared'
import React from 'react'

import { SortColumn } from '../../elements/SortColumn/index.js'
import { AutosaveCell } from './cells/AutosaveCell/index.js'
import { CreatedAtCell, type CreatedAtCellProps } from './cells/CreatedAt/index.js'
import { IDCell } from './cells/ID/index.js'

export const buildVersionColumns = ({
  collectionConfig,
  CreatedAtCellOverride,
  currentlyPublishedVersion,
  docID,
  docs,
  globalConfig,
  i18n: { t },
  isTrashed,
  latestDraftVersion,
}: {
  collectionConfig?: SanitizedCollectionConfig
  CreatedAtCellOverride?: React.ComponentType<CreatedAtCellProps>
  currentlyPublishedVersion?: TypeWithVersion<any>
  docID?: number | string
  docs: PaginatedDocs<TypeWithVersion<any>>['docs']
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
  isTrashed?: boolean
  latestDraftVersion?: TypeWithVersion<any>
}): Column[] => {
  const entityConfig = collectionConfig || globalConfig

  const CreatedAtCellComponent = CreatedAtCellOverride ?? CreatedAtCell

  const columns: Column[] = [
    {
      accessor: 'updatedAt',
      active: true,
      field: {
        name: '',
        type: 'date',
      },
      Heading: <SortColumn Label={t('general:updatedAt')} name="updatedAt" />,
      isLinkedColumn: true,
      renderedCells: docs.map((doc, i) => {
        return (
          <CreatedAtCellComponent
            collectionSlug={collectionConfig?.slug}
            docID={docID}
            globalSlug={globalConfig?.slug}
            isTrashed={isTrashed}
            key={i}
            rowData={{
              id: doc.id,
              updatedAt: doc.updatedAt,
            }}
          />
        )
      }),
    },
  ]

  if (hasDraftsEnabled(entityConfig)) {
    columns.push({
      accessor: '_status',
      active: true,
      field: {
        name: '',
        type: 'checkbox',
      },
      Heading: <SortColumn Label={t('version:status')} name="status" />,
      renderedCells: docs.map((doc, i) => {
        return (
          <AutosaveCell
            currentlyPublishedVersion={currentlyPublishedVersion}
            key={i}
            latestDraftVersion={latestDraftVersion}
            rowData={doc}
          />
        )
      }),
    })
  }

  columns.push({
    accessor: 'id',
    active: true,
    field: {
      name: '',
      type: 'text',
    },
    Heading: <SortColumn Label={t('version:versionID')} name="id" />,
    renderedCells: docs.map((doc, i) => {
      return <IDCell id={doc.id} key={i} />
    }),
  })

  return columns
}
