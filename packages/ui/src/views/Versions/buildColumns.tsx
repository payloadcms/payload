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

import type { CreatedAtCellProps } from './cells/CreatedAt/index.js'

/* eslint-disable payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds */
import {
  VersionsAutosaveCell as AutosaveCell,
  VersionsBranchCell as BranchCell,
  VersionsCreatedAtCell as CreatedAtCell,
  VersionsIDCell as IDCell,
  SortColumn,
} from '../../exports/client/index.js'
/* eslint-enable payload/no-imports-from-exports-dir */

export const buildVersionColumns = ({
  branchingEnabled,
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
  branchingEnabled?: boolean
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

  // History on a branch includes main's rows as its ancestry, so without this the
  // list gives no way to tell whose version you are looking at.
  if (branchingEnabled) {
    columns.push({
      accessor: '_branch',
      active: true,
      field: {
        name: '',
        type: 'text',
      },
      Heading: <SortColumn Label={t('branching:branch')} name="_branch" />,
      renderedCells: docs.map((doc, i) => (
        <BranchCell branch={(doc as { _branch?: string })._branch} key={i} />
      )),
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
