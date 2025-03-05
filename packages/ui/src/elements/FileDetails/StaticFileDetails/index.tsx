'use client'
import React from 'react'

import { Button } from '../../Button/index.js'
import { Thumbnail } from '../../Thumbnail/index.js'
import { UploadActions } from '../../Upload/index.js'
import { FileMeta } from '../FileMeta/index.js'
import './index.scss'

const baseClass = 'file-details'

import type { Data, FileSizes, SanitizedCollectionConfig } from 'payload'

export type StaticFileDetailsProps = {
  customUploadActions?: React.ReactNode[]
  doc: {
    sizes?: FileSizes
  } & Data
  enableAdjustments?: boolean
  handleRemove?: () => void
  hasImageSizes?: boolean
  hideRemoveFile?: boolean
  imageCacheTag?: string
  uploadConfig: SanitizedCollectionConfig['upload']
}

export const StaticFileDetails: React.FC<StaticFileDetailsProps> = (props) => {
  const {
    customUploadActions,
    doc,
    enableAdjustments,
    handleRemove,
    hasImageSizes,
    hideRemoveFile,
    imageCacheTag,
    uploadConfig,
  } = props

  const { filename, filesize, height, mimeType, thumbnailURL, url, width } = doc

  const previewAllowed = uploadConfig.displayPreview ?? true

  return (
    <div className={baseClass}>
      <header>
        {previewAllowed && (
          <Thumbnail
            // size="small"
            className={`${baseClass}__thumbnail`}
            doc={doc}
            fileSrc={thumbnailURL || url}
            imageCacheTag={imageCacheTag}
            uploadConfig={uploadConfig}
          />
        )}
        <div className={`${baseClass}__main-detail`}>
          <FileMeta
            filename={filename as string}
            filesize={filesize as number}
            height={height as number}
            mimeType={mimeType as string}
            url={url as string}
            width={width as number}
          />

          {(enableAdjustments || customUploadActions) && (
            <UploadActions
              customActions={customUploadActions}
              enableAdjustments={Boolean(enableAdjustments)}
              enablePreviewSizes={hasImageSizes && doc.filename}
              mimeType={mimeType}
            />
          )}
        </div>
        {!hideRemoveFile && handleRemove && (
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
