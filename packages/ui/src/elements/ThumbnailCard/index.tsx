'use client'
import type { ClientCollectionConfig, TypeWithID } from 'payload'

import React from 'react'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { formatDocTitle } from '../../utilities/formatDocTitle/index.js'
import './index.css'

export type ThumbnailCardProps = {
  alignLabel?: 'center' | 'left'
  className?: string
  collection?: ClientCollectionConfig
  doc?: { filename?: string } & TypeWithID
  isSelected?: boolean
  label?: string
  onClick?: () => void
  onDoubleClick?: () => void
  onKeyDown?: () => void
  thumbnail: React.ReactNode
}

const baseClass = 'thumbnail-card'

export const ThumbnailCard: React.FC<ThumbnailCardProps> = (props) => {
  const {
    alignLabel,
    className,
    collection,
    doc,
    isSelected,
    label: labelFromProps,
    onClick,
    onDoubleClick,
    thumbnail,
  } = props

  const { config } = useConfig()

  const { i18n } = useTranslation()

  const classes = [
    baseClass,
    className,
    typeof onClick === 'function' && `${baseClass}--has-on-click`,
    isSelected && `${baseClass}--selected`,
    alignLabel && `${baseClass}--align-label-${alignLabel}`,
  ]
    .filter(Boolean)
    .join(' ')

  let title = labelFromProps

  if (!title) {
    title = formatDocTitle({
      collectionConfig: collection,
      data: doc,
      dateFormat: config.admin.dateFormat,
      fallback: doc?.filename,
      i18n,
    })
  }

  return (
    <button
      className={classes}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={title}
      type="button"
    >
      <div className={`${baseClass}__thumbnail`}>{thumbnail}</div>
      <div className={`${baseClass}__label`}>{title}</div>
    </button>
  )
}
