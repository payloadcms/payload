'use client'

import type { HiddenFieldProps } from 'payload'

import React, { useEffect } from 'react'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'

/**
 * This is mainly used to save a value on the form that is not visible to the user.
 * For example, this sets the `ìd` property of a block in the Blocks field.
 */
const HiddenFieldComponent: React.FC<HiddenFieldProps> = (props) => {
  const { disableModifyingForm = true, path, value: valueFromProps } = props

  const { setValue, value } = useField({
    path,
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

export const HiddenField = withCondition(HiddenFieldComponent)
