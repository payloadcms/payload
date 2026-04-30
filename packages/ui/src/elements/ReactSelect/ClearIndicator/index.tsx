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
      // TODO Fix this - Broke with React 19 types
      ref={typeof ref === 'string' ? null : ref}
      {...restInnerProps}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          clearValue()
          e.stopPropagation()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <CircledXIcon className={`${baseClass}__icon`} />
    </div>
  )
}
