'use client'

import type { HiddenFieldProps } from 'payload'

import React, { useEffect } from 'react'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'

/**
 * Renders an input with `type="hidden"`.
 * This is mainly used to save a value on the form that is not visible to the user.
 * For example, this sets the `ìd` property of a block in the Blocks field.
 */
const HiddenFieldComponent: React.FC<HiddenFieldProps> = (props) => {
  const { disableModifyingForm = true, path: pathFromProps, value: valueFromProps } = props

  const { path, setValue, value } = useField({
    potentiallyStalePath: pathFromProps,
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
