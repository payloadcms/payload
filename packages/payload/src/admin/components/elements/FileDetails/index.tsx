import React from 'react'

import type { Props } from './types'

import { UploadActions } from '../../views/collections/Edit/Upload'
import Button from '../Button'
import Thumbnail from '../Thumbnail'
import Meta from './Meta'
import './index.scss'

const baseClass = 'file-details'

const FileDetails: React.FC<Props> = (props) => {
  const { collection, doc, handleRemove, hasSizes } = props

  const {
    slug: collectionSlug,
    upload: { staticURL },
  } = collection

  const { id, filename, filesize, height, mimeType, url, width } = doc

  return (
    <div className={baseClass}>
      <header>
        <Thumbnail collection={collection} doc={doc} />
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

          <UploadActions showSizePreviews={hasSizes} />
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
