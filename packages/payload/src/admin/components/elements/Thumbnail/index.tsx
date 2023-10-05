import React from 'react'

import type { Props } from './types'

import useThumbnail from '../../../hooks/useThumbnail'
import FileGraphic from '../../graphics/File'
import './index.scss'

const baseClass = 'thumbnail'

const Thumbnail: React.FC<Props> = (props) => {
  const { className = '', collection, doc: { filename } = {}, doc, fileSrc, size } = props

  const thumbnailSRC = doc && collection ? useThumbnail(collection, doc) : fileSrc

  const alt = filename && (filename as string)

  const classes = [baseClass, `${baseClass}--size-${size || 'medium'}`, className].join(' ')

  return (
    <div className={classes}>
      {thumbnailSRC && <img alt={alt} src={thumbnailSRC} />}
      {!thumbnailSRC && <FileGraphic />}
    </div>
  )
}
export default Thumbnail
