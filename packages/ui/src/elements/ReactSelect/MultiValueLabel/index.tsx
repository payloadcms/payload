'use client'
import type { MultiValueProps } from 'react-select'

import React from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option } from '../types.js'

import './index.scss'

const baseClass = 'multi-value-label'

export const MultiValueLabel: React.FC<MultiValueProps<Option>> = (props) => {
  // @ts-expect-error-next-line// TODO Fix this - moduleResolution 16 breaks our declare module
  const { data, selectProps: { customProps: { draggableProps, editableProps } = {} } = {} } = props

  const className = `${baseClass}__text`

  return (
    <div className={baseClass}>
      <SelectComponents.MultiValueLabel
        {...props}
        innerProps={{
          className,
          ...((editableProps && editableProps(data, className, props.selectProps)) || {}),
          ...(draggableProps || {}),
        }}
      />
    </div>
  )
}
