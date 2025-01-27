import React, { useEffect, useState } from 'react'

import type { Props } from './types'

import useThumbnail from '../../../hooks/useThumbnail'
import FileGraphic from '../../graphics/File'
import './index.scss'

const baseClass = 'thumbnail'

const Thumbnail: React.FC<Props> = (props) => {
  const {
    className = '',
    collection,
    doc: { filename } = {},
    doc,
    fileSrc,
    imageCacheTag,
    size,
  } = props

  const thumbnailSRC = collection && doc ? useThumbnail(collection, doc) : fileSrc
  const [src, setSrc] = useState(thumbnailSRC)

  const classes = [baseClass, `${baseClass}--size-${size || 'medium'}`, className].join(' ')

  useEffect(() => {
    if (thumbnailSRC) {
      setSrc(`${thumbnailSRC}${imageCacheTag ? `?${imageCacheTag}` : ''}`)
    }
  }, [doc, collection, thumbnailSRC, fileSrc, imageCacheTag])

  return (
    <div className={classes}>
      {src && <img alt={filename as string} src={src} />}
      {!src && <FileGraphic />}
    </div>
  )
}
export default Thumbnail
