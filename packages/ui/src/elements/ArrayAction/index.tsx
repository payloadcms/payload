'use client'
import React from 'react'

import { ArrowIcon } from '../../icons/Arrow/index.js'
import { ClipboardIcon } from '../../icons/Clipboard/index.js'
import { CopyIcon } from '../../icons/Copy/index.js'
import { DuplicateIcon } from '../../icons/Duplicate/index.js'
import { MoreIcon } from '../../icons/More/index.js'
import { PlusIcon } from '../../icons/Plus/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Popup, PopupList } from '../Popup/index.js'
import './index.css'

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
      buttonAriaLabel={t('general:moreOptions')}
      buttonClassName={`${baseClass}__button`}
      caret={false}
      className={baseClass}
      horizontalAlign="right"
      render={({ close }) => {
        return (
          <PopupList.MenuItem>
            {isSortable && index !== 0 && (
              <PopupList.Button
                className={`${baseClass}__action ${baseClass}__move-up`}
                icon={<ArrowIcon direction="up" size={24} />}
                onClick={() => {
                  moveRow(index, index - 1)
                  close()
                }}
              >
                {t('general:moveUp')}
              </PopupList.Button>
            )}
            {isSortable && index < rowCount - 1 && (
              <PopupList.Button
                className={`${baseClass}__action`}
                icon={<ArrowIcon direction="down" size={24} />}
                onClick={() => {
                  moveRow(index, index + 1)
                  close()
                }}
              >
                {t('general:moveDown')}
              </PopupList.Button>
            )}
            {!hasMaxRows && (
              <React.Fragment>
                <PopupList.Button
                  className={`${baseClass}__action ${baseClass}__add`}
                  icon={<PlusIcon size={24} />}
                  onClick={() => {
                    void addRow(index + 1)
                    close()
                  }}
                >
                  {t('general:addBelow')}
                </PopupList.Button>
                <PopupList.Button
                  className={`${baseClass}__action ${baseClass}__duplicate`}
                  icon={<DuplicateIcon size={24} />}
                  onClick={() => {
                    duplicateRow(index)
                    close()
                  }}
                >
                  {t('general:duplicate')}
                </PopupList.Button>
              </React.Fragment>
            )}
            <PopupList.Button
              className={`${baseClass}__action ${baseClass}__copy`}
              icon={<CopyIcon size={24} />}
              onClick={() => {
                copyRow(index)
                close()
              }}
            >
              {t('general:copyRow')}
            </PopupList.Button>
            <PopupList.Button
              className={`${baseClass}__action ${baseClass}__paste`}
              icon={<ClipboardIcon size={24} />}
              onClick={() => {
                pasteRow(index)
                close()
              }}
            >
              {t('general:pasteRow')}
            </PopupList.Button>
            <PopupList.Button
              className={`${baseClass}__action ${baseClass}__remove`}
              icon={<XIcon size={24} />}
              onClick={() => {
                removeRow(index)
                close()
              }}
            >
              {t('general:remove')}
            </PopupList.Button>
          </PopupList.MenuItem>
        )
      }}
    />
  )
}
