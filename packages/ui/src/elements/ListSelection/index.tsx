'use client'
import type { ClientCollectionConfig } from 'payload'

import React, { Fragment } from 'react'

import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { DeleteMany } from '../DeleteMany/index.js'
import { EditMany } from '../EditMany/index.js'
import { PublishMany } from '../PublishMany/index.js'
import { UnpublishMany } from '../UnpublishMany/index.js'
import './index.scss'

const baseClass = 'list-selection'

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
  const { count, selectAll, toggleAll, totalDocs } = useSelection()
  const { t } = useTranslation()

  if (count === 0) {
    return null
  }

  return (
    <div className={baseClass}>
      <span>{t('general:selectedCount', { count, label: '' })}</span>
      {selectAll !== SelectAllStatus.AllAvailable && count < totalDocs && (
        <button
          aria-label={t('general:selectAll', { count, label })}
          className={`${baseClass}__button`}
          id="select-all-across-pages"
          onClick={() => toggleAll(true)}
          type="button"
        >
          {t('general:selectAll', { count: totalDocs, label: '' })}
        </button>
      )}
      {!disableBulkEdit && !disableBulkDelete && <span>&mdash;</span>}
      {!disableBulkEdit && (
        <Fragment>
          <EditMany collection={collectionConfig} />
          <PublishMany collection={collectionConfig} />
          <UnpublishMany collection={collectionConfig} />
        </Fragment>
      )}
      {!disableBulkDelete && <DeleteMany collection={collectionConfig} />}
    </div>
  )
}
