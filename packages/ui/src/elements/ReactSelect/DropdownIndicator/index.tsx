'use client'
import type { DropdownIndicatorProps } from 'react-select'

import React, { type JSX } from 'react'

import type { Option as OptionType } from '../types.js'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'dropdown-indicator'
export const DropdownIndicator: React.FC<
  {
    innerProps: JSX.IntrinsicElements['button']
  } & DropdownIndicatorProps<OptionType, true>
> = (props) => {
  const {
    innerProps: { ref, ...restInnerProps },
  } = props

  const { t } = useTranslation()

  return (
    <button
      aria-label={t('general:open')}
      className={baseClass}
      ref={ref}
      {...restInnerProps}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.key = ' '
        }
      }}
      type="button"
    >
      <ChevronIcon className={`${baseClass}__icon`} size={16} />
    </button>
  )
}
