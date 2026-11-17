'use client'
import type { DropdownIndicatorProps } from 'react-select'

import React from 'react'

import type { Option as OptionType } from '../types.js'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import './index.css'

const baseClass = 'dropdown-indicator'
export const DropdownIndicator: React.FC<DropdownIndicatorProps<OptionType, true>> = (props) => {
  const {
    innerProps: { onMouseDown, onTouchEnd, onTouchStart, ref },
    selectProps: { isDisabled },
  } = props

  return (
    <div
      aria-hidden="true"
      className={baseClass}
      onMouseDown={isDisabled ? undefined : onMouseDown}
      onTouchEnd={isDisabled ? undefined : onTouchEnd}
      onTouchStart={isDisabled ? undefined : onTouchStart}
      ref={ref}
    >
      <ChevronIcon className={`${baseClass}__icon`} size={16} />
    </div>
  )
}
