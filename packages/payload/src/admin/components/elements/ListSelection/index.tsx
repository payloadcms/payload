import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import { SelectAllStatus, useSelection } from '../../views/collections/List/SelectionProvider'
import './index.scss'

const baseClass = 'list-selection'

type Props = {
  label: string
}
const ListSelection: React.FC<Props> = ({ label }) => {
  const { count, selectAll, toggleAll, totalDocs } = useSelection()
  const { t } = useTranslation('general')

  if (count === 0) {
    return null
  }

  return (
    <div className={baseClass}>
      <span>{t('selectedCount', { count, label })}</span>
      {selectAll !== SelectAllStatus.AllAvailable && (
        <Fragment>
          {' '}
          &mdash;
          <button
            aria-label={t('selectAll', { count, label })}
            className={`${baseClass}__button`}
            onClick={() => toggleAll(true)}
            type="button"
          >
            {t('selectAll', { count: totalDocs, label })}
          </button>
        </Fragment>
      )}
    </div>
  )
}

export default ListSelection
