'use client'
import React from 'react'

import './index.scss'

const baseClass = 'thumbnail'

import type { SanitizedCollectionConfig } from 'payload'

import { File } from '../../graphics/File/index.js'
import { useIntersect } from '../../hooks/useIntersect.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'
import { createThumbnail } from './createThumbnail.js'

export type ThumbnailProps = {
  alt?: string
  className?: string
  collectionSlug?: string
  doc?: Record<string, unknown>
  fileSrc?: string
  imageCacheTag?: string
  size?: 'expand' | 'large' | 'medium' | 'small'
  uploadConfig?: SanitizedCollectionConfig['upload']
}

export const Thumbnail = (props: ThumbnailProps) => {
  const { className = '', doc: { filename, mimeType } = {}, fileSrc, imageCacheTag, size } = props
  const classNames = [baseClass, `${baseClass}--size-${size || 'medium'}`, className].join(' ')
  const fileType = (mimeType as string)?.split('/')?.[0]
  const [fileExists, setFileExists] = React.useState<boolean | undefined>(undefined)
  const [src, setSrc] = React.useState<null | string>(
    fileSrc ? `${fileSrc}${imageCacheTag ? `?${imageCacheTag}` : ''}` : null,
  )
  const [intersectionRef, entry] = useIntersect()
  const [hasPreloaded, setHasPreloaded] = React.useState(false)

  React.useEffect(() => {
    if (!fileSrc) {
      setFileExists(false)
      return
    }

    if (!entry?.isIntersecting || hasPreloaded) {
      return
    }
    setHasPreloaded(true)

    createThumbnail(null, fileSrc, mimeType as string)
      .then((src) => {
        setSrc(src)
        setFileExists(true)
      })
      .catch(() => {
        setFileExists(false)
      })
  }, [fileSrc, fileType, imageCacheTag, entry, hasPreloaded])

  const alt = props.alt || (filename as string)

  return (
    <div className={classNames} ref={intersectionRef}>
      {fileExists === undefined && <ShimmerEffect height="100%" />}
      {fileExists && <img alt={alt} src={src} />}
      {fileExists === false && <File />}
    </div>
  )
}
