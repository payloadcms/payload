/* eslint-disable react/destructuring-assignment */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { optionIsObject } from 'payload/types'
import React, { useCallback } from 'react'

import type { Props } from './types.js'

import { useForm } from '../../Form/context.js'
import LabelComp from '../../Label/index.js'
import { useField } from '../../useField/index.js'
import { withCondition } from '../../withCondition/index.js'
import { fieldBaseClass } from '../shared.js'
import { Radio } from './Radio/index.js'
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

  const { uuid } = useForm()

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

          const id = `field-${path}-${optionValue}${uuid ? `-${uuid}` : ''}`

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
                uuid={uuid}
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
