import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import Chevron from '../../icons/Chevron'
import Copy from '../../icons/Copy'
import More from '../../icons/More'
import Plus from '../../icons/Plus'
import X from '../../icons/X'
import Popup from '../Popup'
import './index.scss'

const baseClass = 'array-actions'

export const ArrayAction: React.FC<Props> = ({
  addRow,
  duplicateRow,
  hasMaxRows,
  index,
  moveRow,
  removeRow,
  rowCount,
}) => {
  const { t } = useTranslation('general')
  return (
    <Popup
      button={<More />}
      buttonClassName={`${baseClass}__button`}
      className={baseClass}
      horizontalAlign="center"
      render={({ close }) => {
        return (
          <React.Fragment>
            {index !== 0 && (
              <button
                className={`${baseClass}__action ${baseClass}__move-up`}
                onClick={() => {
                  moveRow(index, index - 1)
                  close()
                }}
                type="button"
              >
                <Chevron />
                {t('moveUp')}
              </button>
            )}
            {index < rowCount - 1 && (
              <button
                className={`${baseClass}__action ${baseClass}__move-down`}
                onClick={() => {
                  moveRow(index, index + 1)
                  close()
                }}
                type="button"
              >
                <Chevron />
                {t('moveDown')}
              </button>
            )}
            {!hasMaxRows && (
              <React.Fragment>
                <button
                  className={`${baseClass}__action ${baseClass}__add`}
                  onClick={() => {
                    addRow(index + 1)
                    close()
                  }}
                  type="button"
                >
                  <Plus />
                  {t('addBelow')}
                </button>
                <button
                  className={`${baseClass}__action ${baseClass}__duplicate`}
                  onClick={() => {
                    duplicateRow(index)
                    close()
                  }}
                  type="button"
                >
                  <Copy />
                  {t('duplicate')}
                </button>
              </React.Fragment>
            )}
            <button
              className={`${baseClass}__action ${baseClass}__remove`}
              onClick={() => {
                removeRow(index)
                close()
              }}
              type="button"
            >
              <X />
              {t('remove')}
            </button>
          </React.Fragment>
        )
      }}
    />
  )
}
