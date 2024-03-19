'use client'
import React, { Fragment } from 'react'

import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'list-selection'

export type ListSelectionProps = {
  label: string
}

export const ListSelection: React.FC<ListSelectionProps> = ({ label }) => {
  const { count, selectAll, toggleAll, totalDocs } = useSelection()
  const { t } = useTranslation()

  if (count === 0) {
    return null
  }

  return (
    <div className={baseClass}>
      <span>{t('general:selectedCount', { count, label })}</span>
      {selectAll !== SelectAllStatus.AllAvailable && (
        <Fragment>
          {' '}
          &mdash;
          <button
            aria-label={t('general:selectAll', { count, label })}
            className={`${baseClass}__button`}
            onClick={() => toggleAll(true)}
            type="button"
          >
            {t('general:selectAll', { count: totalDocs, label })}
          </button>
        </Fragment>
      )}
    </div>
  )
}
