'use client'
import type { ClientCollectionConfig, ViewTypes } from 'payload'

import React, { Fragment, useCallback } from 'react'

import { DeleteMany } from '../../../elements/DeleteMany/index.js'
import { EditMany_v4 } from '../../../elements/EditMany/index.js'
import { ListSelection_v4, ListSelectionButton } from '../../../elements/ListSelection/index.js'
import { PublishMany_v4 } from '../../../elements/PublishMany/index.js'
import { RestoreMany } from '../../../elements/RestoreMany/index.js'
import { UnpublishMany_v4 } from '../../../elements/UnpublishMany/index.js'
import { SelectAllStatus, useSelection } from '../../../providers/Selection/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

export type ListSelectionProps = {
  collectionConfig?: ClientCollectionConfig
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  label: string
  viewType?: ViewTypes
}

export const ListSelection: React.FC<ListSelectionProps> = ({
  collectionConfig,
  disableBulkDelete,
  disableBulkEdit,
  label,
  viewType,
}) => {
  const { count, getSelectedIds, selectAll, toggleAll, totalDocs } = useSelection()
  const { t } = useTranslation()

  const onActionSuccess = useCallback(() => toggleAll(false), [toggleAll])

  if (count === 0) {
    return null
  }

  const isTrashView = collectionConfig?.trash && viewType === 'trash'

  return (
    <ListSelection_v4
      count={count}
      ListActions={[
        selectAll !== SelectAllStatus.AllAvailable && count < totalDocs ? (
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
              ids={getSelectedIds()}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
            />
            <PublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={getSelectedIds()}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
            />
            <UnpublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={getSelectedIds()}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
            />
          </Fragment>
        ),
        isTrashView && (
          <RestoreMany collection={collectionConfig} key="bulk-restore" viewType={viewType} />
        ),
        !disableBulkDelete && (
          <DeleteMany collection={collectionConfig} key="bulk-delete" viewType={viewType} />
        ),
      ].filter(Boolean)}
    />
  )
}
