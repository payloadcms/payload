import type { MultiValueProps } from 'react-select'

import React from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option } from '../types.js'

import './index.scss'

const baseClass = 'multi-value-label'

export const MultiValueLabel: React.FC<MultiValueProps<Option>> = (props) => {
  const {
    selectProps: {
      // @ts-expect-error // TODO: Fix types
      customProps: {
        // @ts-expect-error // TODO: Fix types
        draggableProps,
      } = {},
    } = {},
  } = props

  return (
    <div className={baseClass}>
      <SelectComponents.MultiValueLabel
        {...props}
        innerProps={{
          className: `${baseClass}__text`,
          ...(draggableProps || {}),
        }}
      />
    </div>
  )
}
