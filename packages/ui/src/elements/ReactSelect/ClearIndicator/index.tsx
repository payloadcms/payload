'use client'
import type { ClearIndicatorProps } from 'react-select'

import React from 'react'

import type { Option as OptionType } from '../types.js'

import { CircledXIcon } from '../../../icons/CircledX/index.js'
import './index.css'

const baseClass = 'clear-indicator'

export const ClearIndicator: React.FC<ClearIndicatorProps<OptionType, true>> = (props) => {
  const {
    clearValue,
    innerProps: { ref, ...restInnerProps },
  } = props

  return (
    <div
      className={baseClass}
      ref={ref}
      {...restInnerProps}
      // react-select marks indicators aria-hidden, but this control is focusable,
      // so forwarding that attribute would hide it from assistive tech
      aria-hidden={undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          clearValue()
          e.stopPropagation()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <CircledXIcon className={`${baseClass}__icon`} size={24} />
    </div>
  )
}
