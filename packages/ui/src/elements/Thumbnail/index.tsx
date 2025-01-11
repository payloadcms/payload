'use client'
import React from 'react'

import './index.scss'

const baseClass = 'thumbnail'

import type { SanitizedCollectionConfig } from 'payload'

import { File } from '../../graphics/File/index.js'
import { useIntersect } from '../../hooks/useIntersect.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'

const getImageSrc = (url: string, tag?: string) => {
  if (!url) return ''
  if (!tag) return url

  const hasQueryParams = url.includes('?')
  return hasQueryParams ? `${url}&${tag}` : `${url}?${tag}`
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
  const { className = '', doc: { filename } = {}, fileSrc, imageCacheTag, size } = props
  const [fileExists, setFileExists] = React.useState(undefined)

  const classNames = [baseClass, `${baseClass}--size-${size || 'medium'}`, className].join(' ')

  React.useEffect(() => {
    if (!fileSrc) {
      setFileExists(false)
      return
    }

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
          src={getImageSrc(fileSrc, imageCacheTag)}
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
  readonly size?: 'expand' | 'large' | 'medium' | 'small'
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
          src={getImageSrc(fileSrc, imageCacheTag)}
        />
      )}
      {fileExists === false && <File />}
    </div>
  )
}
