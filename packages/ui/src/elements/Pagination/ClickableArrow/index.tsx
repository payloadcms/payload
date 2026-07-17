'use client'
import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import './index.css'

const baseClass = 'clickable-arrow'

export type ClickableArrowProps = {
  direction?: 'left' | 'right'
  isDisabled?: boolean
  updatePage?: () => void
}

export const ClickableArrow: React.FC<ClickableArrowProps> = (props) => {
  const { direction = 'right', isDisabled = false, updatePage } = props

  const ariaLabel =
  direction === 'left' ? 'Previous page' : 'Next page'

  const classes = [
    baseClass,
    isDisabled && `${baseClass}--is-disabled`,
    direction && `${baseClass}--${direction}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      aria-label={ariaLabel}
      className={classes}
      disabled={isDisabled}
      onClick={!isDisabled ? updatePage : undefined}
      type="button"

    >
      <ChevronIcon area-hidden="true" />
    </button>
  )
}
