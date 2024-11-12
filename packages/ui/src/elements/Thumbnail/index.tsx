'use client'
import React from 'react'

import './index.scss'

const baseClass = 'thumbnail'

import type { SanitizedCollectionConfig } from 'payload'

import { File } from '../../graphics/File/index.js'
import { useIntersect } from '../../hooks/useIntersect.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'

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
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
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
          src={`${fileSrc}${imageCacheTag ? `?${imageCacheTag}` : ''}`}
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
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
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
        <img alt={alt || filename} src={`${fileSrc}${imageCacheTag ? `?${imageCacheTag}` : ''}`} />
      )}
      {fileExists === false && <File />}
    </div>
  )
}
