'use client'
import type { OptionLabel } from 'payload'
import type { MultiValueProps } from 'react-select'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option } from '../types.js'

import { useTranslation } from '../../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'multi-value-label'

export const MultiValueLabel: React.FC<MultiValueProps<Option>> = (props) => {
  // @ts-expect-error-next-line// TODO Fix this - moduleResolution 16 breaks our declare module
  const { data, selectProps: { customProps: { draggableProps, editableProps } = {} } = {} } = props
  const { i18n } = useTranslation()

  const className = `${baseClass}__text`
  const labelText = data.label ? getTranslation(data.label as OptionLabel, i18n) : ''
  const titleText = typeof labelText === 'string' ? labelText : ''

  return (
    <div className={baseClass} title={titleText}>
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
