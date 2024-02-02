'use client'
import React, { useCallback } from 'react'

import type { Props } from './types'

import { withCondition } from '../../withCondition'
import { Radio } from './Radio'
import { optionIsObject } from 'payload/types'
import useField from '../../useField'
import { fieldBaseClass } from '../shared'

import './index.scss'

const baseClass = 'radio-group'

const RadioGroup: React.FC<Props> = (props) => {
  const {
    name,
    className,
    readOnly,
    style,
    width,
    path: pathFromProps,
    Error,
    Label,
    Description,
    validate,
    required,
  } = props

  const options = 'options' in props ? props.options : []

  const layout = 'layout' in props ? props.layout : 'horizontal'

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function')
        return validate(value, { ...validationOptions, options, required })
    },
    [validate, options, required],
  )

  const { setValue, value, path, showError } = useField<string>({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        `${baseClass}--layout-${layout}`,
        showError && 'error',
        readOnly && `${baseClass}--read-only`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__error-wrap`}>{Error}</div>
      {Label}
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
      {Description}
    </div>
  )
}

export default withCondition(RadioGroup)
