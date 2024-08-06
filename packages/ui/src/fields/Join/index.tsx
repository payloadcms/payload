'use client'

import type { JoinFieldProps } from 'payload'

import React, { useEffect } from 'react'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'

const JoinFieldComponent: React.FC<JoinFieldProps> = (props) => {
  const {
    name,
    disableModifyingForm = true,
    forceUsePathFromProps,
    path: pathFromProps,
    value: valueFromProps,
  } = props

  const { path: pathFromContext } = useFieldProps()

  const { path, value } = useField({
    path: (!forceUsePathFromProps ? pathFromContext : null) || pathFromProps || name,
  })

  // TODO: replace hidden placeholder with the actual edit component
  return (
    <input
      id={`field-${path?.replace(/\./g, '__')}`}
      name={path}
      type="hidden"
      value={(value as string) || ''}
    />
  )
}

export const JoinField = withCondition(JoinFieldComponent)
