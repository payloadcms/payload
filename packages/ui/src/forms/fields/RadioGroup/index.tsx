'use client'
import { optionIsObject } from 'payload/types'
import React, { useCallback } from 'react'

import type { Props } from './types'

import LabelComp from '../../Label'
import useField from '../../useField'
import { withCondition } from '../../withCondition'
import { fieldBaseClass } from '../shared'
import { Radio } from './Radio'
import './index.scss'

const baseClass = 'radio-group'

const RadioGroup: React.FC<Props> = (props) => {
  const {
    name,
    Description,
    Error,
    Label: LabelFromProps,
    className,
    label,
    onChange: onChangeFromProps,
    path: pathFromProps,
    readOnly,
    required,
    style,
    validate,
    value: valueFromProps,
    width,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const options = 'options' in props ? props.options : []

  const layout = 'layout' in props ? props.layout : 'horizontal'

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function')
        return validate(value, { ...validationOptions, options, required })
    },
    [validate, options, required],
  )

  const {
    path,
    setValue,
    showError,
    value: valueFromContext,
  } = useField<string>({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const value = valueFromContext || valueFromProps

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
          let optionLabel: Record<string, string> | string = ''

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
                onChange={() => {
                  if (typeof onChangeFromProps === 'function') {
                    onChangeFromProps(optionValue)
                  }

                  if (!readOnly) {
                    setValue(optionValue)
                  }
                }}
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
