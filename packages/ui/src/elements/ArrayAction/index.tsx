'use client'
import React from 'react'

import { ArrowIcon } from '../../icons/Arrow/index.js'
import { DuplicateIcon } from '../../icons/Duplicate/index.js'
import { MoreIcon } from '../../icons/More/index.js'
import { PlusIcon } from '../../icons/Plus/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ClipboardActionLabel } from '../ClipboardAction/ClipboardActionLabel.js'
import './index.css'
import { Popup, PopupList } from '../Popup/index.js'

const baseClass = 'array-actions'

export type Props = {
  addRow: (current: number, blockType?: string) => Promise<void> | void
  copyRow: (index: number) => void
  duplicateRow: (current: number) => void
  hasMaxRows: boolean
  index: number
  isSortable?: boolean
  moveRow: (from: number, to: number) => void
  pasteRow: (index: number) => void
  removeRow: (index: number) => void
  rowCount: number
}

export const ArrayAction: React.FC<Props> = ({
  addRow,
  copyRow,
  duplicateRow,
  hasMaxRows,
  index,
  isSortable,
  moveRow,
  pasteRow,
  removeRow,
  rowCount,
}) => {
  const { t } = useTranslation()

  return (
    <Popup
      button={<MoreIcon />}
      buttonClassName={`${baseClass}__button`}
      caret={false}
      className={baseClass}
      horizontalAlign="right"
      render={({ close }) => {
        return (
          <PopupList.ButtonGroup buttonSize="medium">
            {isSortable && index !== 0 && (
              <PopupList.Button
                className={`${baseClass}__action ${baseClass}__move-up`}
                onClick={() => {
                  moveRow(index, index - 1)
                  close()
                }}
              >
                <div className={`${baseClass}__action-chevron`}>
                  <ArrowIcon direction="up" />
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
                  <ArrowIcon direction="down" />
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
                  <DuplicateIcon />
                  {t('general:duplicate')}
                </PopupList.Button>
              </React.Fragment>
            )}
            <PopupList.Button
              className={`${baseClass}__action ${baseClass}__copy`}
              onClick={() => {
                copyRow(index)
                close()
              }}
            >
              <ClipboardActionLabel isRow />
            </PopupList.Button>
            <PopupList.Button
              className={`${baseClass}__action ${baseClass}__paste`}
              onClick={() => {
                pasteRow(index)
                close()
              }}
            >
              <ClipboardActionLabel isPaste isRow />
            </PopupList.Button>
            <PopupList.Button
              className={`${baseClass}__action ${baseClass}__remove`}
              onClick={() => {
                removeRow(index)
                close()
              }}
            >
              <XIcon size={24} />
              {t('general:remove')}
            </PopupList.Button>
          </PopupList.ButtonGroup>
        )
      }}
      size="medium"
    />
  )
}
