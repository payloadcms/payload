import React, { useState } from 'react'

import type { Props } from './types'

import formatFilesize from '../../../../../uploads/formatFilesize'
import Edit from '../../../icons/Edit'
import { useConfig } from '../../../utilities/Config'
import CopyToClipboard from '../../CopyToClipboard'
import { useDocumentDrawer } from '../../DocumentDrawer'
import Tooltip from '../../Tooltip'
import './index.scss'

const baseClass = 'file-meta'

const Meta: React.FC<Props> = (props) => {
  const { id, collection, filename, filesize, height, mimeType, staticURL, url, width } = props

  const [hovered, setHovered] = useState(false)
  const openInDrawer = Boolean(id && collection)

  const [DocumentDrawer, DocumentDrawerToggler] = useDocumentDrawer({
    id,
    collectionSlug: collection,
  })

  const { serverURL } = useConfig()

  const fileURL = url || `${serverURL}${staticURL}/${filename}`

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
            <Edit />
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

export default Meta
