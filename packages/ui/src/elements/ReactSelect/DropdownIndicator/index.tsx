import type { DropdownIndicatorProps } from 'react-select'

import { Chevron } from '@payloadcms/ui/icons/Chevron'
import React from 'react'

import type { Option as OptionType } from '../types.js'

import './index.scss'

const baseClass = 'dropdown-indicator'

export const DropdownIndicator: React.FC<DropdownIndicatorProps<OptionType, true>> = (props) => {
  const {
    innerProps: { ref, ...restInnerProps },
  } = props

  return (
    <div
      className={baseClass}
      ref={ref}
      {...restInnerProps}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          // trigger the menu to open
          return (e.key = ' ')
        }
      }}
      role="button"
      tabIndex={0}
    >
      <Chevron className={`${baseClass}__icon`} />
    </div>
  )
}
