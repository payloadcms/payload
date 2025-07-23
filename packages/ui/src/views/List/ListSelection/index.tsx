'use client'
import type { ClientCollectionConfig, Where } from 'payload'

import React, { Fragment, useCallback } from 'react'

import { DeleteMany } from '../../../elements/DeleteMany/index.js'
import { EditMany_v4 } from '../../../elements/EditMany/index.js'
import { ListSelection_v4, ListSelectionButton } from '../../../elements/ListSelection/index.js'
import { PublishMany_v4 } from '../../../elements/PublishMany/index.js'
import { UnpublishMany_v4 } from '../../../elements/UnpublishMany/index.js'
import { SelectAllStatus, useSelection } from '../../../providers/Selection/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'

export type ListSelectionProps = {
  collectionConfig?: ClientCollectionConfig
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  label: string
  modalPrefix?: string
  showSelectAllAcrossPages?: boolean
  where?: Where
}

export const ListSelection: React.FC<ListSelectionProps> = ({
  collectionConfig,
  disableBulkDelete,
  disableBulkEdit,
  label,
  modalPrefix,
  showSelectAllAcrossPages = true,
  where,
}) => {
  const { count, selectAll, selectedIDs, toggleAll, totalDocs } = useSelection()
  const { t } = useTranslation()

  const onActionSuccess = useCallback(() => toggleAll(), [toggleAll])

  if (count === 0) {
    return null
  }

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
        !disableBulkEdit && (
          <Fragment key="bulk-actions">
            <EditMany_v4
              collection={collectionConfig}
              count={count}
              ids={selectedIDs}
              modalPrefix={modalPrefix}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
              where={where}
            />
            <PublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={selectedIDs}
              modalPrefix={modalPrefix}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
              where={where}
            />
            <UnpublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={selectedIDs}
              modalPrefix={modalPrefix}
              onSuccess={onActionSuccess}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
              where={where}
            />
          </Fragment>
        ),
        !disableBulkDelete && (
          <DeleteMany collection={collectionConfig} key="bulk-delete" modalPrefix={modalPrefix} />
        ),
      ].filter(Boolean)}
    />
  )
}
