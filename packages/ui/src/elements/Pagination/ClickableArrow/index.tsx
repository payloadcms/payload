'use client'
import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'clickable-arrow'

export type ClickableArrowProps = {
  direction?: 'left' | 'right'
  isDisabled?: boolean
  updatePage?: () => void
}

export const ClickableArrow: React.FC<ClickableArrowProps> = (props) => {
  const { t } = useTranslation()
  const { direction = 'right', isDisabled = false, updatePage } = props

  const classes = [
    baseClass,
    isDisabled && `${baseClass}--is-disabled`,
    direction && `${baseClass}--${direction}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      aria-label={t(direction === 'left' ? 'general:previousPage' : 'general:nextPage')}
      className={classes}
      disabled={isDisabled}
      onClick={!isDisabled ? updatePage : undefined}
      type="button"
    >
      <ChevronIcon />
    </button>
  )
}
