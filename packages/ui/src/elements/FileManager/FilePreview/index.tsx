'use client'
import { formatFilesize, isImage } from 'payload/shared'
import React from 'react'

import type { FileManagerProps } from '../index.js'

import { useTranslation } from '../../../providers/Translation/index.js'
import { MiniCarousel } from '../../MiniCarousel/index.js'
import { Thumbnail } from '../../Thumbnail/index.js'
import './index.css'

const baseClass = 'file-preview'

type Props = {
  readonly data: Record<string, unknown>
  readonly imageCacheTag?: false | string
  readonly selectedSize?: null | string
  readonly selectedSizeData?: null | Record<string, unknown>
  readonly setSelectedSize: (size: null | string) => void
} & Pick<FileManagerProps, 'collectionSlug' | 'uploadConfig' | 'UploadFilePreview'>

export const FilePreview: React.FC<Props> = ({
  collectionSlug,
  data,
  imageCacheTag,
  selectedSize,
  selectedSizeData,
  setSelectedSize,
  uploadConfig,
  UploadFilePreview,
}) => {
  const { t } = useTranslation()

  const hasImageSizes = uploadConfig?.imageSizes?.length > 0
  const isImageFile = isImage((data?.mimeType as string) ?? '')
  const fileSrc = (selectedSizeData?.url ?? data?.thumbnailURL ?? data?.url ?? null) as
    | null
    | string

  const metaString = (() => {
    const w = (selectedSizeData?.width ?? data?.width) as number | undefined
    const h = (selectedSizeData?.height ?? data?.height) as number | undefined
    const parts: string[] = []
    if (typeof w === 'number' && typeof h === 'number') {
      parts.push(`${w} × ${h}`)
    }
    parts.push(
      formatFilesize(((selectedSizeData?.filesize ?? (data?.filesize as number)) || 0) as number),
    )
    if (data?.mimeType) {
      parts.push(data.mimeType as string)
    }
    return parts.join(' – ')
  })()

  return (
    <div className={baseClass}>
      {hasImageSizes && isImageFile && (
        <MiniCarousel
          doc={data}
          imageCacheTag={imageCacheTag}
          onSelect={setSelectedSize}
          selectedSize={selectedSize}
          uploadConfig={uploadConfig}
        />
      )}
      <div className={`${baseClass}__main`}>
        <div className={`${baseClass}__image-wrap`}>
          {UploadFilePreview ?? (
            <Thumbnail
              className={`${baseClass}__thumbnail`}
              collectionSlug={collectionSlug}
              doc={selectedSizeData || data}
              fileSrc={fileSrc}
              imageCacheTag={imageCacheTag}
              size="expand"
              uploadConfig={uploadConfig}
            />
          )}
        </div>
        <div className={`${baseClass}__info`}>
          <span className={`${baseClass}__info-label`}>
            {selectedSize ?? t('general:original')}
          </span>
          <span className={`${baseClass}__info-meta`}>{metaString}</span>
        </div>
      </div>
    </div>
  )
}
