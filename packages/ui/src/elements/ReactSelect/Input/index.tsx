'use client'
import type { ControlProps } from 'react-select'

import React from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option } from '../types.js'

export const Input: React.FC<ControlProps<Option, any>> = (props) => {
  return (
    <React.Fragment>
      {/* @ts-expect-error // TODO Fix this - Broke with React 19 types */}
      <SelectComponents.Input
        {...props}
        /**
         * Adding `aria-activedescendant` fixes hydration error
         * source: https://github.com/JedWatson/react-select/issues/5459#issuecomment-1878037196
         */
        aria-activedescendant={undefined}
      />
    </React.Fragment>
  )
}
