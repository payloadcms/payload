'use client'
import React, { useEffect } from 'react'

import type { FormFieldBase } from '../index.js'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'

export type HiddenInputFieldProps = {
  disableModifyingForm?: false
  forceUsePathFromProps?: boolean
  name?: string
  path?: string
  value?: unknown
} & FormFieldBase

/**
 * This is mainly used to save a value on the form that is not visible to the user.
 * For example, this sets the `ìd` property of a block in the Blocks field.
 */
const _HiddenField: React.FC<HiddenInputFieldProps> = (props) => {
  const {
    name,
    disableModifyingForm = true,
    forceUsePathFromProps,
    path: pathFromProps,
    value: valueFromProps,
  } = props

  const { path: pathFromContext } = useFieldProps()

  const { path, setValue, value } = useField({
    path: (!forceUsePathFromProps ? pathFromContext : null) || pathFromProps || name,
  })

  useEffect(() => {
    if (valueFromProps !== undefined) {
      setValue(valueFromProps, disableModifyingForm)
    }
  }, [valueFromProps, setValue, disableModifyingForm])

  return (
    <input
      id={`field-${path?.replace(/\./g, '__')}`}
      name={path}
      onChange={setValue}
      type="hidden"
      value={(value as string) || ''}
    />
  )
}

export const HiddenField = withCondition(_HiddenField)
