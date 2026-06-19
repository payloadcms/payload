'use client'
import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { CropIcon } from '../../../icons/Crop/index.js'
import { DownloadIcon } from '../../../icons/Download/index.js'
import { ExternalLinkIcon } from '../../../icons/ExternalLink/index.js'
import { RefreshIcon } from '../../../icons/Refresh/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { CopyToClipboard } from '../../CopyToClipboard/index.js'
import { Popup } from '../../Popup/index.js'
import * as PopupList from '../../Popup/PopupButtonList/index.js'
import './index.css'

const baseClass = 'file-toolbar'

type Props = {
  readonly filename: string
  readonly fileSrc?: null | string
  readonly fileUrl?: null | string
  readonly hideRemoveFile?: boolean
  readonly isAdjustable?: boolean
  readonly onEditImage?: () => void
  readonly onReplace?: () => void
}

export const FileToolbar: React.FC<Props> = ({
  filename,
  fileSrc,
  fileUrl,
  hideRemoveFile,
  isAdjustable,
  onEditImage,
  onReplace,
}) => {
  const { t } = useTranslation()

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__left`}>
        {hideRemoveFile ? (
          <span className={`${baseClass}__filename-btn ${baseClass}__filename-btn--static`}>
            <span className={`${baseClass}__filename-text`}>{filename}</span>
          </span>
        ) : (
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
              <PopupList.Button icon={<RefreshIcon />} onClick={onReplace}>
                {t('upload:replaceFile')}
              </PopupList.Button>
            </PopupList.MenuItem>
          </Popup>
        )}
      </div>

      <div className={`${baseClass}__right`}>
        {fileUrl && <CopyToClipboard value={fileUrl} />}
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
        {fileSrc && (
          <a
            aria-label={t('fields:openInNewTab')}
            className={`${baseClass}__icon-link`}
            href={fileSrc}
            rel="noopener noreferrer"
            target="_blank"
            title={t('fields:openInNewTab')}
          >
            <ExternalLinkIcon size={24} />
          </a>
        )}
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
      </div>
    </div>
  )
}
