'use client'
import type { SanitizedCollectionConfig } from 'payload'

import React from 'react'

import { File } from '../../graphics/File/index.js'
import { generateImageSrcWithCacheTag } from '../../utilities/generateCacheTagSrc.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'
import './index.scss'

const baseClass = 'thumbnail'
export type ThumbnailProps = {
  className?: string
  collectionSlug?: string
  doc?: Record<string, unknown>
  fileSrc?: string
  height?: number
  imageCacheTag?: string
  size?: 'expand' | 'large' | 'medium' | 'none' | 'small'
  uploadConfig?: SanitizedCollectionConfig['upload']
  width?: number
}

export const Thumbnail: React.FC<ThumbnailProps> = (props) => {
  const {
    className = '',
    doc: { filename } = {},
    fileSrc,
    height,
    imageCacheTag,
    size,
    width,
  } = props
  const [fileExists, setFileExists] = React.useState(undefined)

  const classNames = [baseClass, `${baseClass}--size-${size || 'medium'}`, className].join(' ')

  React.useEffect(() => {
    if (!fileSrc) {
      setFileExists(false)
      return
    }
    setFileExists(undefined)

    const img = new Image()
    img.src = fileSrc
    img.onload = () => {
      setFileExists(true)
    }
    img.onerror = () => {
      setFileExists(false)
    }
  }, [fileSrc])

  return (
    <div className={classNames}>
      {fileExists === undefined && <ShimmerEffect height="100%" />}
      {fileExists && (
        <img
          alt={filename as string}
          height={height}
          src={generateImageSrcWithCacheTag({
            cacheTag: imageCacheTag,
            src: fileSrc,
          })}
          width={width}
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
  readonly size?: 'expand' | 'large' | 'medium' | 'none' | 'small'
}
export function ThumbnailComponent(props: ThumbnailComponentProps) {
  const { alt, className = '', filename, fileSrc, imageCacheTag, size } = props
  const [fileExists, setFileExists] = React.useState(undefined)

  const classNames = [baseClass, `${baseClass}--size-${size || 'medium'}`, className].join(' ')

  React.useEffect(() => {
    if (!fileSrc) {
      setFileExists(false)
      return
    }
    setFileExists(undefined)

    const img = new Image()
    img.src = fileSrc
    img.onload = () => {
      setFileExists(true)
    }
    img.onerror = () => {
      setFileExists(false)
    }
  }, [fileSrc])

  return (
    <div className={classNames}>
      {fileExists === undefined && <ShimmerEffect height="100%" />}
      {fileExists && (
        <img
          alt={alt || filename}
          src={generateImageSrcWithCacheTag({ cacheTag: imageCacheTag, src: fileSrc })}
        />
      )}
      {fileExists === false && <File />}
    </div>
  )
}
