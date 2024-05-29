'use client'
import type { SingleValueProps } from 'react-select'

import React from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option } from '../types.js'

const baseClass = 'react-select--single-value'

export const SingleValue: React.FC<SingleValueProps<Option>> = (props) => {
  const { children, className } = props

  return (
    <React.Fragment>
      {/* @ts-expect-error // TODO Fix this - Broke with React 19 types */}
      <SelectComponents.SingleValue
        {...props}
        className={[baseClass, className].filter(Boolean).join(' ')}
      >
        {children}
      </SelectComponents.SingleValue>
    </React.Fragment>
  )
}
