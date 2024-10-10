'use client'
import React from 'react'

import './index.scss'

const baseClass = 'thumbnail'

import type { SanitizedCollectionConfig } from 'payload'

import { File } from '../../graphics/File/index.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'

/**
 * Check if specific media exist before render it in it's appropriate HTML tag.
 * This internal hook allows to share this logic between Thumbnail & ThumbnailComponent
 */
const useFileExists = (fileSrc: string | undefined, fileType: string): boolean => {
  const [fileExists, setFileExists] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    if (!fileSrc || !fileType) {
      setFileExists(false)
      return
    }

    if (fileType === 'image') {
      const img = new Image()
      img.src = fileSrc
      img.onload = () => setFileExists(true)
      img.onerror = () => setFileExists(false)
    } else if (fileType === 'video') {
      const video = document.createElement('video')
      video.src = fileSrc
      video.crossOrigin = 'anonymous'
      video.onloadeddata = () => setFileExists(true)
      video.onerror = () => setFileExists(false)
    } else {
      setFileExists(false)
    }
  }, [fileSrc, fileType])

  return fileExists
}

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
  const { className = '', doc: { filename, mimeType } = {}, fileSrc, imageCacheTag, size } = props
  const classNames = [baseClass, `${baseClass}--size-${size || 'medium'}`, className].join(' ')
  const fileType = (mimeType as string)?.split('/')?.[0]

  const fileExists = useFileExists(fileSrc, fileType)
  const src = React.useMemo(
    () => `${fileSrc}${imageCacheTag ? `?${imageCacheTag}` : ''}`,
    [fileSrc, imageCacheTag],
  )

  return (
    <div className={classNames}>
      {fileExists === undefined && <ShimmerEffect height="100%" />}
      {fileExists && fileType === 'image' && <img alt={filename as string} src={src} />}
      {fileExists && fileType === 'video' && (
        <video
          aria-label={filename as string}
          autoPlay={false}
          controls={false}
          muted={true}
          playsInline={true}
          src={src}
        />
      )}
      {fileExists === false && <File />}
    </div>
  )
}

type ThumbnailComponentProps = {
  readonly alt?: string
  readonly className?: string
  readonly filename: string
  readonly fileSrc: string
  readonly imageCacheTag?: string
  readonly mimeType?: string
  readonly size?: 'expand' | 'large' | 'medium' | 'small'
}
export function ThumbnailComponent(props: ThumbnailComponentProps) {
  const { alt, className = '', filename, fileSrc, imageCacheTag, mimeType, size } = props
  const classNames = [baseClass, `${baseClass}--size-${size || 'medium'}`, className].join(' ')
  const fileType = mimeType?.split('/')?.[0]

  const fileExists = useFileExists(fileSrc, fileType)
  const src = React.useMemo(
    () => `${fileSrc}${imageCacheTag ? `?${imageCacheTag}` : ''}`,
    [fileSrc, imageCacheTag],
  )

  return (
    <div className={classNames}>
      {fileExists === undefined && <ShimmerEffect height="100%" />}
      {fileExists && fileType === 'image' && <img alt={alt || filename} src={src} />}
      {fileExists && fileType === 'video' && (
        <video
          aria-label={alt || filename}
          autoPlay={false}
          controls={false}
          muted={true}
          playsInline={true}
          src={src}
        />
      )}
      {fileExists === false && <File />}
    </div>
  )
}
