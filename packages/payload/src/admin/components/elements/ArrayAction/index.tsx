import React from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import Chevron from '../../icons/Chevron'
import Copy from '../../icons/Copy'
import More from '../../icons/More'
import Plus from '../../icons/Plus'
import X from '../../icons/X'
import Popup from '../Popup'
import * as PopupList from '../Popup/PopupButtonList'
import './index.scss'

const baseClass = 'array-actions'

export const ArrayAction: React.FC<Props> = ({
  addRow,
  duplicateRow,
  hasMaxRows,
  index,
  isSortable,
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
          <PopupList.ButtonGroup buttonSize="small">
            {isSortable && index !== 0 && (
              <PopupList.Button
                className={`${baseClass}__action ${baseClass}__move-up`}
                onClick={() => {
                  moveRow(index, index - 1)
                  close()
                }}
              >
                <div className={`${baseClass}__action-chevron`}>
                  <Chevron direction="up" />
                </div>
                {t('moveUp')}
              </PopupList.Button>
            )}
            {isSortable && index < rowCount - 1 && (
              <PopupList.Button
                className={`${baseClass}__action`}
                onClick={() => {
                  moveRow(index, index + 1)
                  close()
                }}
              >
                <div className={`${baseClass}__action-chevron`}>
                  <Chevron />
                </div>
                {t('moveDown')}
              </PopupList.Button>
            )}
            {!hasMaxRows && (
              <React.Fragment>
                <PopupList.Button
                  className={`${baseClass}__action ${baseClass}__add`}
                  onClick={() => {
                    addRow(index + 1)
                    close()
                  }}
                >
                  <Plus />
                  {t('addBelow')}
                </PopupList.Button>
                <PopupList.Button
                  className={`${baseClass}__action ${baseClass}__duplicate`}
                  onClick={() => {
                    duplicateRow(index)
                    close()
                  }}
                >
                  <Copy />
                  {t('duplicate')}
                </PopupList.Button>
              </React.Fragment>
            )}
            <PopupList.Button
              className={`${baseClass}__action ${baseClass}__remove`}
              onClick={() => {
                removeRow(index)
                close()
              }}
            >
              <X />
              {t('remove')}
            </PopupList.Button>
          </PopupList.ButtonGroup>
        )
      }}
      size="medium"
    />
  )
}
