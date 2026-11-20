'use client'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React, { useMemo } from 'react'

import type { DocumentLayout } from '../../../elements/LayoutToggle/index.js'
import type { FlatFolderContents } from '../../List/getFlatFolderContents.js'
import type { SlotColumn } from '../HierarchyTable/SlotTable.js'
import type { TableRow } from '../HierarchyTable/types.js'

import { Button } from '../../../elements/Button/index.js'
import { CardGrid } from '../../../elements/CardGrid/index.js'
import { DocumentCard } from '../../../elements/DocumentCard/index.js'
import { Link } from '../../../elements/Link/index.js'
import { NoListResults } from '../../../elements/NoListResults/index.js'
import { DocumentIcon } from '../../../icons/Document/index.js'
import { FolderIcon } from '../../../icons/Folder/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentSelection } from '../../../providers/DocumentSelection/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { getHierarchyListURL } from '../getHierarchyListURL.js'
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
  layout,
  onLoadMore,
  parentFieldName,
  parentID,
}: {
  collectionSlug: string
  contents: FlatFolderContents
  error?: string
  HierarchyIcon?: React.ReactNode
  isLoading: 'documents' | 'folders' | null
  layout: DocumentLayout
  onLoadMore: (source: 'documents' | 'folders') => void
  parentFieldName: string
  parentID: number | string
}) {
  const { i18n, t } = useTranslation()
  const {
    config: {
      routes: { admin: adminRoute },
    },
    getEntityConfig,
  } = useConfig()
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

  const cardGroups = [
    { items: rows.slice(0, contents.folders.docs.length), key: 'folders', label: folderLabel },
    {
      items: rows.slice(contents.folders.docs.length),
      key: 'documents',
      label: t('general:documents'),
    },
  ]

  const renderCard = (row: TableRow) => {
    const isFolder = row._collectionSlug === collectionSlug
    const config = getEntityConfig({ collectionSlug: row._collectionSlug })
    const titleField = config.admin.useAsTitle || 'id'
    const rawTitle = row[titleField]
    const title =
      typeof rawTitle === 'string' || typeof rawTitle === 'number'
        ? String(rawTitle)
        : String(row.id)
    const thumbnailSrc = typeof row._thumbnailSrc === 'string' ? row._thumbnailSrc : undefined
    const editURL = formatAdminURL({
      adminRoute,
      path: `/collections/${row._collectionSlug}/${encodeURIComponent(String(row.id))}`,
    })
    const folderURL = getHierarchyListURL({
      adminRoute,
      collectionSlug,
      parentFieldName,
      parentID: row.id,
    })

    return (
      <DocumentCard
        href={isFolder ? folderURL : editURL}
        isSelected={isSelected({ id: row.id, collectionSlug: row._collectionSlug })}
        navigateOnTitleClick
        onSelect={
          isLocked({ id: row.id, collectionSlug: row._collectionSlug })
            ? undefined
            : () => toggleRow(row)
        }
        placeholder={isFolder ? (HierarchyIcon ?? <FolderIcon />) : <DocumentIcon />}
        thumbnail={thumbnailSrc ? { alt: '', src: thumbnailSrc } : undefined}
        title={title}
      >
        {isFolder ? (
          <Link aria-label={t('general:editLabel', { label: title })} href={editURL}>
            {t('general:edit')}
          </Link>
        ) : (
          row._collectionLabel
        )}
      </DocumentCard>
    )
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
      {layout === 'grid' ? (
        <div className="flat-folder-contents__grids">
          {cardGroups.map(({ items, key, label }) =>
            items.length ? (
              <CardGrid
                ariaLabel={label}
                getItemClassName={(row) =>
                  isSelected({ id: row.id, collectionSlug: row._collectionSlug })
                    ? 'card-grid__item--selected'
                    : undefined
                }
                getKey={(row) => `${row._collectionSlug}:${row.id}`}
                items={items}
                key={key}
                renderItem={renderCard}
              />
            ) : null,
          )}
        </div>
      ) : (
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
      )}
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
