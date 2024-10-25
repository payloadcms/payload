'use client'
import React from 'react'

import './index.scss'

const baseClass = 'thumbnail'

import type { SanitizedCollectionConfig } from 'payload'

import { File } from '../../graphics/File/index.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'

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
  React.useEffect(() => {
    if (!fileSrc) {
      setFileExists(false)
      return
    }

    if (fileType === 'video') {
      const video = document.createElement('video')
      video.src = fileSrc
      video.crossOrigin = 'anonymous'
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          setSrc(canvas.toDataURL('image/png'))
          setFileExists(true)
        }
      }
      video.onerror = () => setFileExists(false)
      return
    }

    const img = new Image()
    img.src = fileSrc
    img.onload = () => setFileExists(true)
    img.onerror = () => setFileExists(false)
  }, [fileSrc, fileType, imageCacheTag])

  const alt = props.alt || (filename as string)

  return (
    <div className={classNames}>
      {fileExists === undefined && <ShimmerEffect height="100%" />}
      {fileExists && <img alt={alt} src={src} />}
      {fileExists === false && <File />}
    </div>
  )
}
