'use client'

import type { HiddenFieldProps } from 'payload'

import React, { useEffect } from 'react'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'

/**
 * This is mainly used to save a value on the form that is not visible to the user.
 * For example, this sets the `ìd` property of a block in the Blocks field.
 */
const HiddenFieldComponent: React.FC<HiddenFieldProps> = (props) => {
  const {
    clientFieldConfig: { name, _path: pathFromProps },
    disableModifyingForm = true,
    forceUsePathFromProps,
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

export const HiddenField = withCondition(HiddenFieldComponent)
