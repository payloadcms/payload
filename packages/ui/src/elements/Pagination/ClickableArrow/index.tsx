'use client'
import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'clickable-arrow'

export type ClickableArrowProps = {
  direction?: 'left' | 'right'
  isDisabled?: boolean
  updatePage?: () => void
}

export const ClickableArrow: React.FC<ClickableArrowProps> = (props) => {
  const { direction = 'right', isDisabled = false, updatePage } = props
  const { i18n } = useTranslation()

  const classes = [
    baseClass,
    isDisabled && `${baseClass}--is-disabled`,
    direction && `${baseClass}--${direction}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      aria-label={direction === 'left' ? i18n.t('general:previous') : i18n.t('general:next')}
      className={classes}
      disabled={isDisabled}
      onClick={!isDisabled ? updatePage : undefined}
      type="button"
    >
      <ChevronIcon />
    </button>
  )
}
