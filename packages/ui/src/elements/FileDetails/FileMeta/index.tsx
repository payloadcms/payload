'use client'
import { formatFilesize } from 'payload/shared'
import React, { useState } from 'react'

export type FileMetaProps = {
  collection?: string
  filename: string
  filesize: number
  height?: number
  id?: string
  mimeType: string
  sizes?: unknown
  url: string
  width?: number
}

import { EditIcon } from '../../../icons/Edit/index.js'
import { CopyToClipboard } from '../../CopyToClipboard/index.js'
import { useDocumentDrawer } from '../../DocumentDrawer/index.js'
import { Tooltip } from '../../Tooltip/index.js'
import './index.scss'

const baseClass = 'file-meta'

export const FileMeta: React.FC<FileMetaProps> = (props) => {
  const { id, collection, filename, filesize, height, mimeType, url: fileURL, width } = props

  const [hovered, setHovered] = useState(false)
  const openInDrawer = Boolean(id && collection)

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    id,
    collectionSlug: collection,
  })

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__url`}>
        {openInDrawer && <DocumentDrawer />}
        <a href={fileURL} rel="noopener noreferrer" target="_blank">
          {filename}
        </a>
        <CopyToClipboard defaultMessage="Copy URL" value={fileURL} />
        {openInDrawer && (
          <DocumentDrawerToggler
            className={`${baseClass}__edit`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <EditIcon />
            <Tooltip show={hovered}>Edit</Tooltip>
          </DocumentDrawerToggler>
        )}
      </div>
      <div className={`${baseClass}__size-type`}>
        {formatFilesize(filesize)}
        {width && height && (
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
