'use client'
import React from 'react'

import './index.scss'

const baseClass = 'thumbnail'

import type { SanitizedCollectionConfig } from 'payload'

import { File } from '../../graphics/File/index.js'
import { appendCacheTag } from '../../utilities/appendCacheTag.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'

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

  const src = React.useMemo(
    () => (fileSrc ? appendCacheTag(fileSrc, imageCacheTag) : null),
    [fileSrc, imageCacheTag],
  )

  React.useEffect(() => {
    if (!src) {
      setFileExists(false)
      return
    }
    setFileExists(undefined)

    const img = new Image()
    img.src = src
    img.onload = () => {
      setFileExists(true)
    }
    img.onerror = () => {
      setFileExists(false)
    }
  }, [src])

  return (
    <div className={classNames}>
      {fileExists === undefined && <ShimmerEffect height="100%" />}
      {fileExists && <img alt={filename as string} height={height} src={src} width={width} />}
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

  const src = React.useMemo(
    () => (fileSrc ? appendCacheTag(fileSrc, imageCacheTag) : null),
    [fileSrc, imageCacheTag],
  )

  React.useEffect(() => {
    if (!src) {
      setFileExists(false)
      return
    }
    setFileExists(undefined)

    const img = new Image()
    img.src = src
    img.onload = () => {
      setFileExists(true)
    }
    img.onerror = () => {
      setFileExists(false)
    }
  }, [src])

  return (
    <div className={classNames}>
      {fileExists === undefined && <ShimmerEffect height="100%" />}
      {fileExists && <img alt={alt || filename} src={src} />}
      {fileExists === false && <File />}
    </div>
  )
}
