'use client'
import { formatFilesize } from 'payload/shared'
import React from 'react'

export type FileMetaProps = {
  filename: string
  filesize: number
  height?: number
  mimeType: string
  sizes?: unknown
  url: string
  width?: number
}

import { CopyToClipboard } from '../../CopyToClipboard/index.js'
import './index.scss'

const baseClass = 'file-meta'

export const FileMeta: React.FC<FileMetaProps> = (props) => {
  const { filename, filesize, height, mimeType, url: fileURL, width } = props

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__url`}>
        <a href={fileURL} rel="noopener noreferrer" target="_blank">
          {filename}
        </a>
        <CopyToClipboard defaultMessage="Copy URL" value={fileURL} />
      </div>
      <div className={`${baseClass}__size-type`}>
        {formatFilesize(filesize)}
        {typeof width === 'number' && typeof height === 'number' && (
          <React.Fragment>
            &nbsp;-&nbsp;
            {width}x{height}
          </React.Fragment>
        )}
        {mimeType && (
          <React.Fragment>
            &nbsp;-&nbsp;
            {mimeType}
          </React.Fragment>
        )}
      </div>
    </div>
  )
}
