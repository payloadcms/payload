'use client'
import React from 'react'

import './index.scss'

const baseClass = 'thumbnail'

import type { SanitizedCollectionConfig } from 'payload/types'

import { File } from '../../graphics/File/index.js'
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

const ThumbnailContext = React.createContext({
  className: '',
  filename: '',
  size: 'medium',
  src: '',
})

export const useThumbnailContext = () => React.useContext(ThumbnailContext)

export const Thumbnail: React.FC<ThumbnailProps> = (props) => {
  const { className = '', doc: { filename } = {}, fileSrc, size } = props
  const [fileExists, setFileExists] = React.useState(undefined)

  const classNames = [baseClass, `${baseClass}--size-${size || 'medium'}`, className].join(' ')

  React.useEffect(() => {
    if (!fileSrc) {
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
      {fileExists && <img alt={filename as string} src={fileSrc} />}
      {fileExists === false && <File />}
    </div>
  )
}
