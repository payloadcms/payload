'use client'
import type { OptionLabel } from 'payload'
import type { AriaAttributes } from 'react'
import type { ValueContainerProps } from 'react-select'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option, ReactSelectAdapterProps } from '../types.js'

import { useTranslation } from '../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'value-container'

export const ValueContainer: React.FC<ValueContainerProps<Option, any>> = (props) => {
  // @ts-expect-error-next-line // TODO Fix this - moduleResolution 16 breaks our declare module
  const { selectProps: { customProps, value } = {} } = props
  const { i18n } = useTranslation()
  const selectProps = props.selectProps as Pick<
    ReactSelectAdapterProps,
    'aria-describedby' | 'aria-required'
  >

  const children = React.Children.map(props.children, (child) => {
    if (
      !React.isValidElement<{ role?: string } & AriaAttributes>(child) ||
      child.props.role !== 'combobox'
    ) {
      return child
    }

    const describedBy = [child.props['aria-describedby'], selectProps['aria-describedby']]
      .join(' ')
      .split(/\s+/)
      .filter(Boolean)

    return React.cloneElement(child, {
      'aria-describedby': [...new Set(describedBy)].join(' ') || undefined,
      'aria-required': selectProps['aria-required'] ?? child.props['aria-required'],
    })
  })

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
      <SelectComponents.ValueContainer {...props}>{children}</SelectComponents.ValueContainer>
    </div>
  )
}
