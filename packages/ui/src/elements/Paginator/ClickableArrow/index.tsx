import React from 'react'

import type { Props } from './types'

import Chevron from '../../../icons/Chevron'
import './index.scss'

const baseClass = 'clickable-arrow'

const ClickableArrow: React.FC<Props> = (props) => {
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
      className={classes}
      disabled={isDisabled}
      onClick={!isDisabled ? updatePage : undefined}
      type="button"
    >
      <Chevron />
    </button>
  )
}

export default ClickableArrow
