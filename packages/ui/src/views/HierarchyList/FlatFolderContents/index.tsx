'use client'

import { getTranslation } from '@payloadcms/translations'
import React, { useMemo } from 'react'

import type { FlatFolderContents } from '../../List/getFlatFolderContents.js'
import type { SlotColumn } from '../HierarchyTable/SlotTable.js'
import type { TableRow } from '../HierarchyTable/types.js'

import { Button } from '../../../elements/Button/index.js'
import { NoListResults } from '../../../elements/NoListResults/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentSelection } from '../../../providers/DocumentSelection/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { ChildNameCell } from '../HierarchyTable/ChildNameCell.js'
import { DateCell } from '../HierarchyTable/DateCell.js'
import { RelatedNameCell } from '../HierarchyTable/RelatedNameCell.js'
import { SlotTable } from '../HierarchyTable/SlotTable.js'
import { baseClass as tableClass } from '../HierarchyTable/types.js'
import './index.css'

const NameCell: SlotColumn<TableRow>['Cell'] = (props) =>
  props.row._hasChildren !== undefined ? (
    <ChildNameCell {...props} isDirectLink />
  ) : (
    <RelatedNameCell {...props} />
  )

const CollectionCell: SlotColumn<TableRow>['Cell'] = ({ row }) => (
  <span>{row._collectionLabel}</span>
)

export function FlatFolderContentsView({
  collectionSlug,
  contents,
  error,
  HierarchyIcon,
  isLoading,
  onLoadMore,
  parentID,
}: {
  collectionSlug: string
  contents: FlatFolderContents
  error?: string
  HierarchyIcon?: React.ReactNode
  isLoading: 'documents' | 'folders' | null
  onLoadMore: (source: 'documents' | 'folders') => void
  parentID: number | string
}) {
  const { i18n, t } = useTranslation()
  const { getEntityConfig } = useConfig()
  const { isLocked, isSelected, toggleSelection } = useDocumentSelection()

  const rows = useMemo<TableRow[]>(
    () =>
      [...contents.folders.docs, ...contents.documents.docs].map((doc) => {
        const config = getEntityConfig({ collectionSlug: doc._collectionSlug })
        const isFolder = doc._collectionSlug === collectionSlug
        const hierarchy =
          isFolder && config.hierarchy && typeof config.hierarchy === 'object'
            ? config.hierarchy
            : undefined

        return {
          ...doc,
          _collectionLabel: getTranslation(config.labels?.plural, i18n),
          _collectionSlug: doc._collectionSlug,
          ...(isFolder
            ? {
                _allowedCollections: hierarchy?.collectionSpecific
                  ? doc[hierarchy.collectionSpecific.fieldName]
                  : undefined,
                _hasChildren: Boolean(doc._hasChildren),
                _hierarchyIcon: HierarchyIcon,
              }
            : {}),
        }
      }),
    [
      HierarchyIcon,
      collectionSlug,
      contents.documents.docs,
      contents.folders.docs,
      getEntityConfig,
      i18n,
    ],
  )

  const columns = useMemo<SlotColumn<TableRow>[]>(
    () => [
      {
        accessor: 'name',
        Cell: NameCell,
        className: `${tableClass}__col-name`,
        heading: t('general:name'),
        isLinked: true,
      },
      {
        accessor: 'collection',
        Cell: CollectionCell,
        className: `${tableClass}__col-collection`,
        heading: t('general:collection'),
      },
      {
        accessor: 'updatedAt',
        Cell: DateCell,
        className: `${tableClass}__col-date`,
        heading: t('general:updatedAt'),
      },
    ],
    [t],
  )

  const toggleRow = (row: TableRow) => {
    toggleSelection({
      id: row.id,
      collectionSlug: row._collectionSlug,
      metadata:
        row._collectionSlug === collectionSlug
          ? { allowedCollections: row._allowedCollections as string[] | undefined }
          : {},
    })
  }

  const selectableRows = rows.filter(
    (row) => !isLocked({ id: row.id, collectionSlug: row._collectionSlug }),
  )
  const selectedIDs = new Set(
    rows
      .filter((row) => isSelected({ id: row.id, collectionSlug: row._collectionSlug }))
      .map((row) => `${row._collectionSlug}:${row.id}`),
  )
  const loadMore = t('general:loadMore')
  const folderLabel = getTranslation(getEntityConfig({ collectionSlug }).labels.plural, i18n)

  const toggleAll = () => {
    const areAllSelected = selectableRows.every((row) =>
      isSelected({ id: row.id, collectionSlug: row._collectionSlug }),
    )

    for (const row of selectableRows) {
      if (isSelected({ id: row.id, collectionSlug: row._collectionSlug }) === areAllSelected) {
        toggleRow(row)
      }
    }
  }

  if (!rows.length && !isLoading) {
    return (
      <NoListResults
        description={t('general:noResultsDescription')}
        title={t('general:noResultsFound')}
        withMargin
      />
    )
  }

  return (
    <div className="flat-folder-contents">
      <SlotTable
        collectionSlug={collectionSlug}
        columns={columns}
        data={rows}
        enableDragHandle={false}
        getRowId={(row) => `${row._collectionSlug}:${row.id}`}
        getRowLockedUser={(row) =>
          isLocked({ id: row.id, collectionSlug: row._collectionSlug })
            ? row._userEditing
            : undefined
        }
        onCheckboxChange={toggleRow}
        onSelectAllChange={toggleAll}
        parentId={parentID}
        selectedIds={selectedIDs}
      />
      <div className="flat-folder-contents__more">
        {contents.folders.hasNextPage && (
          <Button
            aria-label={`${loadMore} ${folderLabel.toLocaleLowerCase(i18n.language)}`}
            buttonStyle="secondary"
            disabled={Boolean(isLoading)}
            loading={isLoading === 'folders'}
            onClick={() => onLoadMore('folders')}
          >
            {loadMore} {folderLabel.toLocaleLowerCase(i18n.language)}
          </Button>
        )}
        {contents.documents.hasNextPage && (
          <Button
            aria-label={`${loadMore} ${t('general:documents').toLocaleLowerCase(i18n.language)}`}
            buttonStyle="secondary"
            disabled={Boolean(isLoading)}
            loading={isLoading === 'documents'}
            onClick={() => onLoadMore('documents')}
          >
            {loadMore} {t('general:documents').toLocaleLowerCase(i18n.language)}
          </Button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
