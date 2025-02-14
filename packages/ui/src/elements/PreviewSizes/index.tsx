'use client'
import type { Data, FileSize, SanitizedCollectionConfig, SanitizedUploadConfig } from 'payload'

import React, { useEffect, useMemo, useState } from 'react'

import { FileMeta } from '../FileDetails/FileMeta/index.js'
import './index.scss'

const baseClass = 'preview-sizes'

type FileInfo = {
  url: string
} & FileSize
type FilesSizesWithUrl = {
  [key: string]: FileInfo
}

const sortSizes = (sizes: FilesSizesWithUrl, imageSizes: SanitizedUploadConfig['imageSizes']) => {
  if (!imageSizes || imageSizes.length === 0) {
    return sizes
  }

  const orderedSizes: FilesSizesWithUrl = {}

  imageSizes.forEach(({ name }) => {
    if (sizes[name]) {
      orderedSizes[name] = sizes[name]
    }
  })

  return orderedSizes
}

type PreviewSizeCardProps = {
  active: boolean
  meta: FileInfo
  name: string
  onClick?: () => void
  previewSrc: string
}
const PreviewSizeCard: React.FC<PreviewSizeCardProps> = ({
  name,
  active,
  meta,
  onClick,
  previewSrc,
}) => {
  return (
    <div
      className={[`${baseClass}__sizeOption`, active && `${baseClass}--selected`]
        .filter(Boolean)
        .join(' ')}
      onClick={typeof onClick === 'function' ? onClick : undefined}
      onKeyDown={(e) => {
        if (typeof onClick !== 'function') {
          return
        }
        if (e.key === 'Enter') {
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className={`${baseClass}__image`}>
        <img alt={meta.filename} src={previewSrc} />
      </div>
      <div className={`${baseClass}__sizeMeta`}>
        <div className={`${baseClass}__sizeName`}>{name}</div>
        <FileMeta {...meta} />
      </div>
    </div>
  )
}

export type PreviewSizesProps = {
  doc: {
    sizes?: FilesSizesWithUrl
  } & Data
  imageCacheTag?: string
  uploadConfig: SanitizedCollectionConfig['upload']
}

export const PreviewSizes: React.FC<PreviewSizesProps> = ({ doc, imageCacheTag, uploadConfig }) => {
  const { imageSizes } = uploadConfig
  const { sizes } = doc

  const [orderedSizes, setOrderedSizes] = useState<FilesSizesWithUrl>(() =>
    sortSizes(sizes, imageSizes),
  )
  const [selectedSize, setSelectedSize] = useState<null | string>(null)

  const generateImageUrl = (doc) => {
    if (!doc.filename) {
      return null
    }
    if (doc.url) {
      return `${doc.url}${imageCacheTag ? `?${encodeURIComponent(imageCacheTag)}` : ''}`
    }
  }
  useEffect(() => {
    setOrderedSizes(sortSizes(sizes, imageSizes))
  }, [sizes, imageSizes, imageCacheTag])

  const mainPreviewSrc = selectedSize
    ? generateImageUrl(doc.sizes[selectedSize])
    : generateImageUrl(doc)

  const originalImage = useMemo(
    (): FileInfo => ({
      filename: doc.filename,
      filesize: doc.filesize,
      height: doc.height,
      mimeType: doc.mimeType,
      url: doc.url,
      width: doc.width,
    }),
    [doc],
  )
  const originalFilename = 'Original'

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__imageWrap`}>
        <div className={`${baseClass}__meta`}>
          <div className={`${baseClass}__sizeName`}>{selectedSize || originalFilename}</div>
          <FileMeta {...(selectedSize ? orderedSizes[selectedSize] : originalImage)} />
        </div>
        <img alt={doc.filename} className={`${baseClass}__preview`} src={mainPreviewSrc} />
      </div>
      <div className={`${baseClass}__listWrap`}>
        <div className={`${baseClass}__list`}>
          <PreviewSizeCard
            active={!selectedSize}
            meta={originalImage}
            name={originalFilename}
            onClick={() => setSelectedSize(null)}
            previewSrc={generateImageUrl(doc)}
          />

          {Object.entries(orderedSizes).map(([key, val]) => {
            const selected = selectedSize === key
            const previewSrc = generateImageUrl(val)

            if (previewSrc) {
              return (
                <PreviewSizeCard
                  active={selected}
                  key={key}
                  meta={val}
                  name={key}
                  onClick={() => setSelectedSize(key)}
                  previewSrc={previewSrc}
                />
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}
