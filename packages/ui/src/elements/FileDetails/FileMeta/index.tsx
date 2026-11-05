'use client'
import { formatFilesize } from 'payload/shared'
import React from 'react'

export type FileMetaProps = {
  filename: string
  filesize: null | number
  height?: number
  mimeType: string
  url: string
  variants?: unknown
  width?: number
}

import { useTranslation } from '../../../providers/Translation/index.js'
import { CopyToClipboard } from '../../CopyToClipboard/index.js'
import './index.css'

const baseClass = 'file-meta'

export const FileMeta: React.FC<FileMetaProps> = (props) => {
  const { filename, filesize, height, mimeType, url: fileURL, width } = props

  const { t } = useTranslation()

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__url`}>
        <a href={fileURL} rel="noopener noreferrer" target="_blank">
          {filename}
        </a>
        <CopyToClipboard defaultMessage={t('upload:copyURL')} value={fileURL} />
      </div>
      <div className={`${baseClass}__size-type`}>
        {[
          typeof filesize === 'number' ? formatFilesize(filesize) : null,
          typeof width === 'number' && typeof height === 'number' ? `${width}x${height}` : null,
          mimeType,
        ]
          .filter(Boolean)
          .join('\u00a0-\u00a0')}
      </div>
    </div>
  )
}
