import React from 'react'

import type { Props } from './types'

import isImage from '../../../../uploads/isImage'
import { UploadActions } from '../../views/collections/Edit/Upload'
import Button from '../Button'
import Thumbnail from '../Thumbnail'
import Meta from './Meta'
import './index.scss'

const baseClass = 'file-details'

const FileDetails: React.FC<Props> = (props) => {
  const { canEdit, collection, doc, handleRemove, hasImageSizes, imageCacheTag } = props

  const {
    slug: collectionSlug,
    upload: { staticURL },
  } = collection

  const { id, filename, filesize, height, mimeType, url, width } = doc

  return (
    <div className={baseClass}>
      <header>
        <Thumbnail collection={collection} doc={doc} imageCacheTag={imageCacheTag} />
        <div className={`${baseClass}__main-detail`}>
          <Meta
            collection={collectionSlug}
            filename={filename as string}
            filesize={filesize as number}
            height={height as number}
            id={id as string}
            mimeType={mimeType as string}
            staticURL={staticURL}
            url={url as string}
            width={width as number}
          />

          {isImage(mimeType as string) && mimeType !== 'image/svg+xml' && (
            <UploadActions canEdit={canEdit} showSizePreviews={hasImageSizes && doc.filename} />
          )}
        </div>
        {handleRemove && (
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__remove`}
            icon="x"
            iconStyle="with-border"
            onClick={handleRemove}
            round
          />
        )}
      </header>
    </div>
  )
}

export default FileDetails
