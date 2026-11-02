'use client'
import type { GroupBase, OptionProps } from 'react-select'

import React from 'react'
import { components as SelectComponents } from 'react-select'

import type { Option as OptionType } from '../types.js'

export const getOptionAccessibleName = (
  option: OptionType,
  renderedLabel?: React.ReactNode,
  fallbackLabel?: unknown,
): string | undefined => {
  if (typeof option.plainTextLabel === 'string' && option.plainTextLabel.trim()) {
    return option.plainTextLabel
  }

  if (typeof option.label === 'string' && option.label.trim()) {
    return option.label
  }

  if (typeof renderedLabel === 'string' && renderedLabel.trim()) {
    return renderedLabel
  }

  return typeof fallbackLabel === 'string' && fallbackLabel !== '[object Object]'
    ? fallbackLabel
    : undefined
}

export const Option: React.FC<OptionProps<OptionType, boolean, GroupBase<OptionType>>> = (
  props,
) => {
  const accessibleName = getOptionAccessibleName(props.data, props.children, props.label)

  return (
    <SelectComponents.Option
      {...props}
      innerProps={{
        ...props.innerProps,
        ...(accessibleName ? { 'aria-label': accessibleName } : {}),
      }}
    />
  )
}
