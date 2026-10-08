'use client'
import React from 'react'

import './index.css'

const baseClass = 'thumbnail'

import type { SanitizedCollectionConfig } from 'payload'

import { File } from '../../graphics/File/index.js'
import { appendCacheTag } from '../../utilities/appendCacheTag.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'

type ImageLoadState = 'error' | 'loaded' | undefined

export type ThumbnailProps = {
  className?: string
  collectionSlug?: string
  doc?: Record<string, unknown>
  fileSrc?: string
  height?: number
  imageCacheTag?: false | string
  size?: 'expand' | 'large' | 'medium' | 'none' | 'small'
  uploadConfig?: Omit<SanitizedCollectionConfig['upload'], 'uploadInstructions'>
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

  const classNames = [baseClass, `${baseClass}--size-${size || 'medium'}`, className].join(' ')

  const src = React.useMemo(
    () => (fileSrc ? appendCacheTag(fileSrc, imageCacheTag) : null),
    [fileSrc, imageCacheTag],
  )

  return (
    <div className={classNames}>
      <ThumbnailImage alt={filename as string} height={height} src={src} width={width} />
    </div>
  )
}

type ThumbnailComponentProps = {
  readonly alt?: string
  readonly className?: string
  readonly filename: string
  readonly fileSrc: string
  readonly imageCacheTag?: false | string
  readonly size?: 'expand' | 'large' | 'medium' | 'none' | 'small'
}
export function ThumbnailComponent(props: ThumbnailComponentProps) {
  const { alt, className = '', filename, fileSrc, imageCacheTag, size } = props

  const classNames = [baseClass, `${baseClass}--size-${size || 'medium'}`, className].join(' ')

  const src = React.useMemo(
    () => (fileSrc ? appendCacheTag(fileSrc, imageCacheTag) : null),
    [fileSrc, imageCacheTag],
  )

  return (
    <div className={classNames}>
      <ThumbnailImage alt={alt || filename} src={src} />
    </div>
  )
}

export function getImageLoadState({
  complete,
  naturalWidth,
}: Pick<HTMLImageElement, 'complete' | 'naturalWidth'>): ImageLoadState {
  if (!complete) {
    return undefined
  }

  return naturalWidth > 0 ? 'loaded' : 'error'
}

function ThumbnailImage({
  alt,
  height,
  src,
  width,
}: {
  alt: string
  height?: number
  src: null | string
  width?: number
}) {
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const imageRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    const loadState = imageRef.current ? getImageLoadState(imageRef.current) : undefined

    setHasLoaded(loadState === 'loaded')
    setHasError(loadState === 'error')
  }, [src])

  if (!src || hasError) {
    return <File />
  }

  return (
    <React.Fragment>
      {!hasLoaded && <ShimmerEffect height="100%" />}
      <img
        alt={alt}
        decoding="async"
        height={height}
        loading="lazy"
        onError={() => setHasError(true)}
        onLoad={() => setHasLoaded(true)}
        ref={imageRef}
        src={src}
        width={width}
      />
    </React.Fragment>
  )
}
