'use client'

import type { JoinFieldProps } from 'payload'

import React from 'react'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'

const JoinFieldComponent: React.FC<JoinFieldProps> = (props) => {
  const {
    field: { name, _path: pathFromProps, collection, on },
  } = props

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { path, value } = useField({
    path: pathFromContext ?? pathFromProps ?? name,
  })

  console.log('field props', props)

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
