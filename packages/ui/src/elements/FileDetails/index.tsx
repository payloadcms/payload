'use client'
import React from 'react'

import { UploadActions } from '../../elements/Upload/index.js'
import { Button } from '../Button/index.js'
import { Thumbnail } from '../Thumbnail/index.js'
import { FileMeta } from './FileMeta/index.js'
import './index.scss'

const baseClass = 'file-details'

import type { Data, FileSizes, SanitizedCollectionConfig } from 'payload'

export type FileDetailsProps = {
  collectionSlug: string
  customUploadActions?: React.ReactNode[]
  doc: {
    sizes?: FileSizes
  } & Data
  enableAdjustments?: boolean
  handleRemove?: () => void
  hasImageSizes?: boolean
  imageCacheTag?: string
  uploadConfig: SanitizedCollectionConfig['upload']
}

export const FileDetails: React.FC<FileDetailsProps> = (props) => {
  const {
    collectionSlug,
    customUploadActions,
    doc,
    enableAdjustments,
    handleRemove,
    hasImageSizes,
    imageCacheTag,
    uploadConfig,
  } = props

  const { id, filename, filesize, height, mimeType, thumbnailURL, url, width } = doc

  return (
    <div className={baseClass}>
      <header>
        <Thumbnail
          collectionSlug={collectionSlug}
          doc={doc}
          fileSrc={thumbnailURL || url}
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

          <UploadActions
            customActions={customUploadActions}
            enableAdjustments={enableAdjustments}
            enablePreviewSizes={hasImageSizes && doc.filename}
            mimeType={mimeType}
          />
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
