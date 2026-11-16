'use client'
import type { ClientCollectionConfig, TypeWithID } from 'payload'

import React, { useId } from 'react'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { formatDocTitle } from '../../utilities/formatDocTitle/index.js'
import './index.css'

export type ThumbnailCardProps = {
  alignLabel?: 'center' | 'left'
  className?: string
  collection?: ClientCollectionConfig
  description?: string
  doc?: { filename?: string } & TypeWithID
  extraButtonProps?: {
    ref?: React.Ref<HTMLButtonElement>
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
  isSelected?: boolean
  label?: string
  onClick?: () => void
  onDoubleClick?: () => void
  onKeyDown?: () => void
  /** Render a decorative thumbnail outside the button, allowing previews that contain controls. */
  shouldRenderThumbnailOutsideButton?: boolean
  thumbnail: React.ReactNode
}

const baseClass = 'thumbnail-card'

export const ThumbnailCard: React.FC<ThumbnailCardProps> = (props) => {
  const {
    alignLabel,
    className,
    collection,
    description,
    doc,
    extraButtonProps,
    isSelected,
    label: labelFromProps,
    onClick,
    onDoubleClick,
    shouldRenderThumbnailOutsideButton,
    thumbnail,
  } = props

  const descriptionID = useId()
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

  const button = (
    <button
      {...extraButtonProps}
      aria-describedby={
        [extraButtonProps?.['aria-describedby'], description ? descriptionID : undefined]
          .filter(Boolean)
          .join(' ') || undefined
      }
      aria-label={description ? title : undefined}
      aria-pressed={
        typeof isSelected === 'boolean' ? isSelected : extraButtonProps?.['aria-pressed']
      }
      className={classes}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={title}
      type="button"
    >
      <div className={`${baseClass}__thumbnail`}>
        {shouldRenderThumbnailOutsideButton ? null : thumbnail}
      </div>
      <div className={`${baseClass}__details`}>
        <div className={`${baseClass}__label`}>{title}</div>
        {description && (
          <div className={`${baseClass}__description`} id={descriptionID}>
            {description}
          </div>
        )}
      </div>
    </button>
  )

  return shouldRenderThumbnailOutsideButton ? (
    <div className={`${baseClass}__wrapper`}>
      {button}
      <div aria-hidden="true" className={`${baseClass}__preview`} inert>
        {thumbnail}
      </div>
    </div>
  ) : (
    button
  )
}
