import { isImage } from 'payload/utilities'
import React from 'react'

import type { Props } from './types.js'

import { UploadActions } from '../../elements/Upload/index.js'
import { Button } from '../Button/index.js'
import Thumbnail from '../Thumbnail/index.js'
import FileMeta from './FileMeta/index.js'
import './index.scss'

const baseClass = 'file-details'

const FileDetails: React.FC<Props> = (props) => {
  const { canEdit, collectionSlug, doc, handleRemove, hasImageSizes, imageCacheTag, uploadConfig } =
    props

  const { id, filename, filesize, height, mimeType, url, width } = doc

  return (
    <div className={baseClass}>
      <header>
        <Thumbnail
          collectionSlug={collectionSlug}
          doc={doc}
          imageCacheTag={imageCacheTag}
          uploadConfig={uploadConfig}
        />
        <div className={`${baseClass}__main-detail`}>
          <FileMeta
            collection={collectionSlug}
            filename={filename as string}
            filesize={filesize as number}
            height={height as number}
            id={id as string}
            mimeType={mimeType as string}
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
