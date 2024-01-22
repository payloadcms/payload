'use client'
import React, { useCallback } from 'react'

import { Option, Validate, optionIsObject } from 'payload/types'
import useField from '../../../useField'
import { Radio } from '../Radio'

export const RadioGroupInput: React.FC<{
  readOnly: boolean
  path: string
  required?: boolean
  options: Option[]
  name?: string
  validate?: Validate
  baseClass: string
}> = (props) => {
  const { name, readOnly, path: pathFromProps, required, validate, options, baseClass } = props

  const path = pathFromProps || name

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function')
        return validate(value, { ...validationOptions, options, required })
    },
    [validate, options, required],
  )

  const { setValue, value } = useField<string>({
    path,
    validate: memoizedValidate,
  })

  return (
    <ul className={`${baseClass}--group`} id={`field-${path.replace(/\./g, '__')}`}>
      {options.map((option) => {
        let optionValue = ''
        let optionLabel: string | Record<string, string> = ''

        if (optionIsObject(option)) {
          optionValue = option.value
          optionLabel = option.label
        } else {
          optionValue = option
          optionLabel = option
        }

        const isSelected = String(optionValue) === String(value)

        const id = `field-${path}-${optionValue}`

        return (
          <li key={`${path} - ${optionValue}`}>
            <Radio
              id={id}
              isSelected={isSelected}
              onChange={readOnly ? undefined : setValue}
              option={optionIsObject(option) ? option : { label: option, value: option }}
              path={path}
            />
          </li>
        )
      })}
    </ul>
  )
}
