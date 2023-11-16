import type { ClearIndicatorProps } from 'react-select'

import React from 'react'

import type { Option as OptionType } from '../types'

import X from '../../../icons/X'
import './index.scss'

const baseClass = 'clear-indicator'

export const ClearIndicator: React.FC<ClearIndicatorProps<OptionType, true>> = (props) => {
  const {
    innerProps: { ref, ...restInnerProps },
  } = props

  return (
    <div className={baseClass} ref={ref} {...restInnerProps}>
      <X className={`${baseClass}__icon`} />
    </div>
  )
}
