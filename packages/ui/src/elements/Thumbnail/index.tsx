'use client'
import React, { useEffect, useState } from 'react'

import { File } from '../../graphics/File/index.js'
import { useThumbnail } from '../../hooks/useThumbnail.js'
import './index.scss'

const baseClass = 'thumbnail'

import type { SanitizedCollectionConfig } from 'payload/types'

export type ThumbnailProps = {
  className?: string
  collectionSlug?: string
  doc?: Record<string, unknown>
  fileSrc?: string
  imageCacheTag?: string
  size?: 'expand' | 'large' | 'medium' | 'small'
  uploadConfig?: SanitizedCollectionConfig['upload']
}

export const Thumbnail: React.FC<ThumbnailProps> = (props) => {
  const {
    className = '',
    collectionSlug,
    doc: { filename } = {},
    doc,
    fileSrc,
    imageCacheTag,
    size,
    uploadConfig,
  } = props

  const thumbnailSRC = useThumbnail(collectionSlug, uploadConfig, doc) || fileSrc
  const [src, setSrc] = useState(thumbnailSRC)

  const classes = [baseClass, `${baseClass}--size-${size || 'medium'}`, className].join(' ')

  useEffect(() => {
    if (thumbnailSRC) {
      setSrc(`${thumbnailSRC}${imageCacheTag ? `?${imageCacheTag}` : ''}`)
    }
  }, [thumbnailSRC, imageCacheTag])

  return (
    <div className={classes}>
      {src && <img alt={filename as string} src={src} />}
      {!src && <File />}
    </div>
  )
}
