'use client'
import type { ClientCollectionConfig, ViewTypes, Where } from 'payload'

import { combineWhereConstraints } from 'payload/shared'
import React, { Fragment, useCallback, useMemo } from 'react'

import { DeleteMany } from '../../../elements/DeleteMany/index.js'
import { EditMany_v4 } from '../../../elements/EditMany/index.js'
import { ListSelection_v4, ListSelectionButton } from '../../../elements/ListSelection/index.js'
import { PublishMany_v4 } from '../../../elements/PublishMany/index.js'
import { RestoreMany } from '../../../elements/RestoreMany/index.js'
import { UnpublishMany_v4 } from '../../../elements/UnpublishMany/index.js'
import { useListQuery } from '../../../providers/ListQuery/index.js'
import { SelectAllStatus, useSelection } from '../../../providers/Selection/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

export type ListSelectionProps = {
  collectionConfig?: ClientCollectionConfig
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  hasDeletePermission?: boolean
  hasTrashPermission?: boolean
  label: string
  modalPrefix?: string
  showSelectAllAcrossPages?: boolean
  viewType?: ViewTypes
  where?: Where
}

export const ListSelection: React.FC<ListSelectionProps> = ({
  collectionConfig,
  disableBulkDelete,
  disableBulkEdit,
  hasDeletePermission,
  hasTrashPermission,
  label,
  modalPrefix,
  showSelectAllAcrossPages = true,
  viewType,
  where,
}) => {
  const { count, selectAll, selectedIDs, toggleAll, totalDocs } = useSelection()
  const { t } = useTranslation()
  const { baseFilter, query } = useListQuery()
  const bulkActionWhere = useMemo(() => {
    const combinedWhere = combineWhereConstraints([baseFilter, query?.where, where])

    return Object.keys(combinedWhere).length > 0 ? combinedWhere : undefined
  }, [baseFilter, query?.where, where])

  const onActionSuccess = useCallback(() => toggleAll(), [toggleAll])

  if (count === 0) {
    return null
  }

  const isTrashView = collectionConfig?.trash && viewType === 'trash'

  return (
    <ListSelection_v4
      count={count}
      ListActions={[
        selectAll !== SelectAllStatus.AllAvailable &&
        count < totalDocs &&
        showSelectAllAcrossPages !== false ? (
          <ListSelectionButton
            aria-label={t('general:selectAll', { count: `(${totalDocs})`, label })}
            id="select-all-across-pages"
            key="select-all"
            onClick={() => toggleAll(true)}
          >
            {t('general:selectAll', { count: `(${totalDocs})`, label: '' })}
          </ListSelectionButton>
        ) : null,
      ].filter(Boolean)}
      SelectionActions={[
        !disableBulkEdit && !isTrashView && (
          <Fragment key="bulk-actions">
            <EditMany_v4
              collection={collectionConfig}
              count={count}
              ids={selectedIDs}
              modalPrefix={modalPrefix}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
              where={bulkActionWhere}
            />
            <PublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={selectedIDs}
              modalPrefix={modalPrefix}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
              where={bulkActionWhere}
            />
            <UnpublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={selectedIDs}
              modalPrefix={modalPrefix}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
              where={bulkActionWhere}
            />
          </Fragment>
        ),
        isTrashView && (
          <RestoreMany
            collection={collectionConfig}
            key="bulk-restore"
            modalPrefix={modalPrefix}
            viewType={viewType}
            where={bulkActionWhere}
          />
        ),
        !disableBulkDelete && (
          <DeleteMany
            collection={collectionConfig}
            hasDeletePermission={hasDeletePermission}
            hasTrashPermission={hasTrashPermission}
            key="bulk-delete"
            modalPrefix={modalPrefix}
            viewType={viewType}
            where={bulkActionWhere}
          />
        ),
      ].filter(Boolean)}
    />
  )
}
