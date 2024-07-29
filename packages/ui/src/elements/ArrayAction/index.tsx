'use client'
import React from 'react'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { CopyIcon } from '../../icons/Copy/index.js'
import { MoreIcon } from '../../icons/More/index.js'
import { PlusIcon } from '../../icons/Plus/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import './index.scss'

const baseClass = 'array-actions'

export type Props = {
  addRow: (current: number, blockType?: string) => Promise<void> | void
  duplicateRow: (current: number) => void
  hasMaxRows: boolean
  index: number
  isSortable?: boolean
  moveRow: (from: number, to: number) => void
  removeRow: (index: number) => void
  rowCount: number
}

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
  const { t } = useTranslation()

  return (
    <Popup
      button={<MoreIcon />}
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
                  <ChevronIcon direction="up" />
                </div>
                {t('general:moveUp')}
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
                  <ChevronIcon />
                </div>
                {t('general:moveDown')}
              </PopupList.Button>
            )}
            {!hasMaxRows && (
              <React.Fragment>
                <PopupList.Button
                  className={`${baseClass}__action ${baseClass}__add`}
                  onClick={() => {
                    void addRow(index + 1)
                    close()
                  }}
                >
                  <PlusIcon />
                  {t('general:addBelow')}
                </PopupList.Button>
                <PopupList.Button
                  className={`${baseClass}__action ${baseClass}__duplicate`}
                  onClick={() => {
                    duplicateRow(index)
                    close()
                  }}
                >
                  <CopyIcon />
                  {t('general:duplicate')}
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
              <XIcon />
              {t('general:remove')}
            </PopupList.Button>
          </PopupList.ButtonGroup>
        )
      }}
      size="medium"
    />
  )
}
