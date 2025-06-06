'use client'
import type { ClientCollectionConfig } from 'payload'

import React, { Fragment } from 'react'

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
}

export const ListSelection: React.FC<ListSelectionProps> = ({
  collectionConfig,
  disableBulkDelete,
  disableBulkEdit,
  label,
}) => {
  const { count, getSelectedIds, selectAll, toggleAll, totalDocs } = useSelection()
  const { t } = useTranslation()

  if (count === 0) {
    return null
  }

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
        !disableBulkEdit && (
          <Fragment key="bulk-actions">
            <EditMany_v4
              collection={collectionConfig}
              count={count}
              ids={getSelectedIds()}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
            />
            <PublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={getSelectedIds()}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
            />
            <UnpublishMany_v4
              collection={collectionConfig}
              count={count}
              ids={getSelectedIds()}
              selectAll={selectAll === SelectAllStatus.AllAvailable}
            />
          </Fragment>
        ),
        !disableBulkDelete && <DeleteMany collection={collectionConfig} key="bulk-delete" />,
      ].filter(Boolean)}
    />
  )
}
