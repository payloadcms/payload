'use client'
import { formatFilesize, isImage } from 'payload/shared'
import React from 'react'

import type { FileManagerProps } from '../index.js'

import { useTranslation } from '../../../providers/Translation/index.js'
import { appendCacheTag } from '../../../utilities/appendCacheTag.js'
import { MiniCarousel } from '../../MiniCarousel/index.js'
import { Thumbnail } from '../../Thumbnail/index.js'
import { AudioPreview } from './AudioPreview/index.js'
import { PdfPreview } from './PdfPreview/index.js'
import { VideoPreview } from './VideoPreview/index.js'
import './index.css'

const baseClass = 'file-preview'

type Props = {
  readonly data: Record<string, unknown>
  readonly imageCacheTag?: false | string
  readonly previewSources?: Record<string, string>
  readonly selectedSize?: null | string
  readonly selectedSizeData?: null | Record<string, unknown>
  readonly setSelectedSize: (size: null | string) => void
} & Pick<FileManagerProps, 'collectionSlug' | 'uploadConfig' | 'UploadFilePreview'>

export const FilePreview: React.FC<Props> = ({
  collectionSlug,
  data,
  imageCacheTag,
  previewSources,
  selectedSize,
  selectedSizeData,
  setSelectedSize,
  uploadConfig,
  UploadFilePreview,
}) => {
  const { t } = useTranslation()

  const hasVariants = uploadConfig?.variants?.length > 0
  const mimeType = (data?.mimeType as string) ?? ''
  const isImageFile = isImage(mimeType)
  const fileSrc = (selectedSizeData?.url ?? data?.thumbnailURL ?? data?.url ?? null) as
    | null
    | string

  const previewData = React.useMemo(
    () =>
      previewSources?.default
        ? {
            ...data,
            url: previewSources.default,
            variants: Object.fromEntries(
              Object.entries(previewSources)
                .filter(([name]) => name !== 'default')
                .map(([name, url]) => [
                  name,
                  {
                    ...((data.variants as Record<string, Record<string, unknown>>)?.[name] ?? {}),
                    url,
                  },
                ]),
            ),
          }
        : data,
    [data, previewSources],
  )

  const originalUrl = data?.url as string | undefined
  const nativePreviewSrc = originalUrl ? appendCacheTag(originalUrl, imageCacheTag) : undefined

  // Built-in previews for native file types; images (and unknown types) fall back to the thumbnail.
  const renderBuiltInPreview = () => {
    if (nativePreviewSrc && !isImageFile) {
      if (mimeType.startsWith('video/')) {
        return <VideoPreview fileSrc={nativePreviewSrc} />
      }
      if (mimeType.startsWith('audio/')) {
        return <AudioPreview fileSrc={nativePreviewSrc} />
      }
      if (mimeType === 'application/pdf') {
        return <PdfPreview fileSrc={nativePreviewSrc} title={data?.filename as string} />
      }
    }

    return (
      <Thumbnail
        className={`${baseClass}__thumbnail`}
        collectionSlug={collectionSlug}
        doc={selectedSizeData || data}
        fileSrc={previewSources?.[selectedSize ?? 'default'] || fileSrc}
        imageCacheTag={imageCacheTag}
        size="expand"
        uploadConfig={uploadConfig}
      />
    )
  }

  const metaString = (() => {
    if (previewSources?.[selectedSize ?? 'default']) {
      return t('version:preview')
    }
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
      {hasVariants && isImageFile && (
        <MiniCarousel
          doc={previewData}
          imageCacheTag={imageCacheTag}
          onSelect={setSelectedSize}
          selectedSize={selectedSize}
          uploadConfig={uploadConfig}
        />
      )}
      <div className={`${baseClass}__main`}>
        <div className={`${baseClass}__image-wrap`}>
          {UploadFilePreview ?? renderBuiltInPreview()}
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
