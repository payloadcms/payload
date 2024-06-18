'use client'
import type { DropdownIndicatorProps } from 'react-select'

import { ChevronIcon } from '@payloadcms/ui/icons/Chevron'
import React, { type JSX } from 'react'

import type { Option as OptionType } from '../types.js'

import './index.scss'

const baseClass = 'dropdown-indicator'
export const DropdownIndicator: React.FC<
  DropdownIndicatorProps<OptionType, true> & {
    innerProps: JSX.IntrinsicElements['button']
  }
> = (props) => {
  const {
    innerProps: { ref, ...restInnerProps },
  } = props

  return (
    <button
      className={baseClass}
      ref={ref}
      {...restInnerProps}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.key = ' '
      }}
      type="button"
    >
      <ChevronIcon className={`${baseClass}__icon`} />
    </button>
  )
}
