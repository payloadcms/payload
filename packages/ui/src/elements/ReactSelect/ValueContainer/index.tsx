'use client'
import type { OptionLabel } from 'payload'
import type { ValueContainerProps } from 'react-select'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option } from '../types.js'

import { useTranslation } from '../../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'value-container'

export const ValueContainer: React.FC<ValueContainerProps<Option, any>> = (props) => {
  // @ts-expect-error-next-line // TODO Fix this - moduleResolution 16 breaks our declare module
  const { selectProps: { customProps, value } = {} } = props
  const { i18n } = useTranslation()

  // Get the title for single-value selects
  let titleText = ''
  if (value && !Array.isArray(value) && typeof value === 'object' && 'label' in value) {
    const labelText = value.label ? getTranslation(value.label as OptionLabel, i18n) : ''
    titleText = typeof labelText === 'string' ? labelText : ''
  }

  return (
    <div className={baseClass} ref={customProps?.droppableRef} title={titleText}>
      {customProps?.valueContainerLabel && (
        <span className={`${baseClass}__label`}>{customProps?.valueContainerLabel}</span>
      )}
      <SelectComponents.ValueContainer {...props} />
    </div>
  )
}
