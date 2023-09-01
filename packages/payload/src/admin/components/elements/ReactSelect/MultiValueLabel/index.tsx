import type { MultiValueProps } from 'react-select'

import React from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option } from '../types'

import './index.scss'

const baseClass = 'multi-value-label'

export const MultiValueLabel: React.FC<MultiValueProps<Option>> = (props) => {
  // @ts-expect-error // TODO Fix this - moduleResolution 16 breaks our declare module
  const { selectProps: { customProps: { draggableProps } = {} } = {} } = props

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
