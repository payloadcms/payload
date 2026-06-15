'use client'
import { useModal } from '@faceless-ui/modal'
import React, { useCallback } from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { CropIcon } from '../../../icons/Crop/index.js'
import { DownloadIcon } from '../../../icons/Download/index.js'
import { EditIcon } from '../../../icons/Edit/index.js'
import { LinkIcon } from '../../../icons/Link/index.js'
import { RefreshIcon } from '../../../icons/Refresh/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { Popup } from '../../Popup/index.js'
import * as PopupList from '../../Popup/PopupButtonList/index.js'
import { renameFileModalSlug, UploadRenameModal } from '../UploadRenameModal/index.js'
import './index.css'

const baseClass = 'upload-toolbar'

type Props = {
  readonly canRemove?: boolean
  readonly filename: string
  readonly fileSrc?: null | string
  readonly isAdjustable?: boolean
  readonly onEditImage?: () => void
  readonly onRemove?: () => void
  readonly onRenameConfirm: (newName: string) => void
  readonly onReplace?: () => void
}

export const UploadToolbar: React.FC<Props> = ({
  canRemove,
  filename,
  fileSrc,
  isAdjustable,
  onEditImage,
  onRemove,
  onRenameConfirm,
  onReplace,
}) => {
  const { t } = useTranslation()
  const { openModal } = useModal()

  const copyURL = useCallback(() => {
    if (fileSrc) {
      void navigator.clipboard.writeText(fileSrc)
    }
  }, [fileSrc])

  return (
    <>
      <UploadRenameModal currentFilename={filename} onConfirm={onRenameConfirm} />
      <div className={baseClass}>
        <div className={`${baseClass}__left`}>
          <Popup
            button={
              <span className={`${baseClass}__filename-btn`}>
                <span className={`${baseClass}__filename-text`}>{filename}</span>
                <ChevronIcon size={16} />
              </span>
            }
            buttonType="custom"
            horizontalAlign="left"
            size="small"
            verticalAlign="bottom"
          >
            <PopupList.MenuItem>
              <PopupList.Button icon={<EditIcon />} onClick={() => openModal(renameFileModalSlug)}>
                {t('general:rename')}
              </PopupList.Button>
              <PopupList.Button icon={<RefreshIcon />} onClick={onReplace}>
                {t('upload:replaceFile')}
              </PopupList.Button>
            </PopupList.MenuItem>
          </Popup>
        </div>

        <div className={`${baseClass}__center`}>
          {isAdjustable && (
            <Button
              aria-label={t('upload:editImage')}
              buttonStyle="ghost"
              icon={<CropIcon size={24} />}
              margin={false}
              onClick={onEditImage}
              round={false}
              tooltip={t('upload:editImage')}
            />
          )}
        </div>

        <div className={`${baseClass}__right`}>
          {fileSrc && (
            <a
              aria-label={t('upload:download')}
              className={`${baseClass}__icon-link`}
              download={filename}
              href={fileSrc}
              title={t('upload:download')}
            >
              <DownloadIcon size={24} />
            </a>
          )}
          {fileSrc && (
            <Button
              aria-label={t('general:copy')}
              buttonStyle="ghost"
              icon={<LinkIcon size={24} />}
              margin={false}
              onClick={copyURL}
              round={false}
              tooltip={t('general:copy')}
            />
          )}
          {canRemove && (
            <Button
              aria-label={t('general:remove')}
              buttonStyle="ghost"
              icon={<XIcon size={24} />}
              margin={false}
              onClick={onRemove}
              round={false}
              tooltip={t('general:remove')}
            />
          )}
        </div>
      </div>
    </>
  )
}
