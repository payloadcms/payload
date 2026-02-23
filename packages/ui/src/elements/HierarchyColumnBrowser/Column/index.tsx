'use client'
import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import type { DocumentDrawerContextType } from '../../DocumentDrawer/Provider.js'
import type { ColumnItemData, ColumnProps } from '../types.js'

import { PlusIcon } from '../../../icons/Plus/index.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { useDocumentDrawer } from '../../DocumentDrawer/index.js'
import { LoadMoreRow } from '../../LoadMoreRow/index.js'
import { Spinner } from '../../Spinner/index.js'
import { ColumnItem } from '../ColumnItem/index.js'
import './index.scss'

const baseClass = 'hierarchy-column'

export const Column: React.FC<ColumnProps> = ({
  ancestorsWithSelections,
  collectionSlug,
  expandedId,
  hasNextPage,
  Icon,
  isLoading,
  items,
  onDocumentCreated,
  onExpand,
  onLoadMore,
  onSelect,
  parentFieldName,
  parentId,
  parentTitle,
  selectedIds,
  totalDocs,
  useAsTitle,
}) => {
  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()
  const { getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const collectionLabel = collectionConfig
    ? getTranslation(collectionConfig.labels?.singular || collectionSlug, i18n)
    : collectionSlug

  const canCreate = permissions?.collections?.[collectionSlug]?.create

  const [DocumentDrawer, , { openDrawer }] = useDocumentDrawer({
    collectionSlug,
  })

  const handleSave: DocumentDrawerContextType['onSave'] = useCallback(
    ({ doc, operation }) => {
      if (operation === 'create') {
        const newItem: ColumnItemData = {
          id: doc.id,
          hasChildren: true,
          title: String(doc[useAsTitle] || doc.id),
        }
        onDocumentCreated(newItem)
      }
    },
    [onDocumentCreated, useAsTitle],
  )

  const initialData = parentId !== null ? { [parentFieldName]: parentId } : undefined
  const headerTitle = parentTitle || (parentId === null ? t('general:all') : '')

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <span className={`${baseClass}__header-title`}>{headerTitle}</span>
        {canCreate && (
          <Button
            buttonStyle="muted-text"
            className={`${baseClass}__add-button`}
            icon={<PlusIcon />}
            iconPosition="left"
            margin={false}
            onClick={openDrawer}
            size="xsmall"
          >
            New {collectionLabel}
          </Button>
        )}
      </div>
      <DocumentDrawer initialData={initialData} onSave={handleSave} />

      <div className={`${baseClass}__items`}>
        {items.map((item) => (
          <ColumnItem
            hasSelectedDescendants={ancestorsWithSelections.has(item.id)}
            isExpanded={expandedId === item.id}
            isSelected={selectedIds.has(item.id)}
            item={item}
            key={String(item.id)}
            onExpand={onExpand}
            onSelect={onSelect}
          />
        ))}

        {isLoading && (
          <div className={`${baseClass}__loading`}>
            <Spinner loadingText={null} size="small" />
          </div>
        )}

        {!isLoading && totalDocs > 0 && (
          <LoadMoreRow
            className={`${baseClass}__load-more`}
            currentCount={items.length}
            hasMore={hasNextPage}
            onLoadMore={onLoadMore}
            totalDocs={totalDocs}
          />
        )}
      </div>
    </div>
  )
}
