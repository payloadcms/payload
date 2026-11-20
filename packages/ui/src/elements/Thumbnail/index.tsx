'use client'
import React from 'react'

import './index.css'

const baseClass = 'thumbnail'

import type { SanitizedCollectionConfig } from 'payload'

import { File } from '../../graphics/File/index.js'
import { useVideoFrame } from '../../hooks/useVideoFrame.js'
import { appendCacheTag } from '../../utilities/appendCacheTag.js'
import { RenderIfInViewport } from '../RenderIfInViewport/index.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'

type ThumbnailSize = 'expand' | 'large' | 'medium' | 'none' | 'small'

export type ThumbnailProps = {
  className?: string
  collectionSlug?: string
  doc?: Record<string, unknown>
  fileSrc?: string
  height?: number
  imageCacheTag?: false | string
  /** Render `fileSrc` as a video frame instead of an image. */
  isVideo?: boolean
  size?: ThumbnailSize
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
    isVideo,
    size,
    width,
  } = props

  return (
    <ThumbnailMedia
      alt={filename as string}
      className={getClassNames({ className, size })}
      height={height}
      isVideo={isVideo}
      src={useCacheTaggedSrc({ fileSrc, imageCacheTag })}
      width={width}
    />
  )
}

type ThumbnailComponentProps = {
  readonly alt?: string
  readonly className?: string
  readonly filename: string
  readonly fileSrc: string
  readonly imageCacheTag?: false | string
  /** Render `fileSrc` as a video frame instead of an image. */
  readonly isVideo?: boolean
  readonly size?: ThumbnailSize
}
export function ThumbnailComponent(props: ThumbnailComponentProps) {
  const { alt, className = '', filename, fileSrc, imageCacheTag, isVideo, size } = props

  return (
    <ThumbnailMedia
      alt={alt || filename}
      className={getClassNames({ className, size })}
      isVideo={isVideo}
      src={useCacheTaggedSrc({ fileSrc, imageCacheTag })}
    />
  )
}

type ThumbnailMediaProps = {
  readonly alt: string
  readonly className: string
  readonly height?: number
  readonly isVideo?: boolean
  readonly src: null | string
  readonly width?: number
}

function ThumbnailMedia({ isVideo, ...props }: ThumbnailMediaProps) {
  if (isVideo) {
    // Keyed by src so a new video starts from a fresh loading state
    return <VideoThumbnailMedia key={props.src} {...props} />
  }

  return <ImageThumbnailMedia {...props} />
}

function ImageThumbnailMedia({
  alt,
  className,
  height,
  src,
  width,
}: Omit<ThumbnailMediaProps, 'isVideo'>) {
  const [fileExists, setFileExists] = React.useState<boolean | undefined>(undefined)

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
    <div className={className}>
      {fileExists === undefined && <ShimmerEffect height="100%" />}
      {fileExists && <img alt={alt} height={height} src={src} width={width} />}
      {fileExists === false && <File />}
    </div>
  )
}

/**
 * Lets the browser paint an early frame of the video. A `<video>` element needs no CORS
 * headers to display cross-origin media, unlike drawing the frame onto a canvas.
 */
function VideoThumbnailMedia({
  alt,
  className,
  height,
  src,
  width,
}: Omit<ThumbnailMediaProps, 'isVideo'>) {
  if (!src) {
    return (
      <div className={className}>
        <File />
      </div>
    )
  }

  // Defers loading video metadata until the thumbnail is near the viewport, e.g. in long lists
  return (
    <RenderIfInViewport className={className}>
      <VideoThumbnailFrame alt={alt} height={height} src={src} width={width} />
    </RenderIfInViewport>
  )
}

function VideoThumbnailFrame({
  alt,
  height,
  src,
  width,
}: { src: string } & Pick<ThumbnailMediaProps, 'alt' | 'height' | 'width'>) {
  const { isLoading, shouldRenderVideo, shouldShowFallback, videoProps } = useVideoFrame({ src })

  return (
    <>
      {isLoading && <ShimmerEffect height="100%" />}
      {shouldRenderVideo && (
        <video {...videoProps} aria-label={alt} height={height} muted width={width} />
      )}
      {shouldShowFallback && <File />}
    </>
  )
}

function useCacheTaggedSrc({
  fileSrc,
  imageCacheTag,
}: {
  fileSrc: string | undefined
  imageCacheTag: false | string | undefined
}): null | string {
  return React.useMemo(
    () => (fileSrc ? appendCacheTag(fileSrc, imageCacheTag) : null),
    [fileSrc, imageCacheTag],
  )
}

function getClassNames({
  className,
  size,
}: {
  className: string
  size: ThumbnailSize | undefined
}): string {
  return [baseClass, `${baseClass}--size-${size || 'medium'}`, className].join(' ')
}
