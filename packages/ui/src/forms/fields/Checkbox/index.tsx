'use client'
import type { Validate } from 'payload/types'

import React, { useCallback } from 'react'

import type { Props } from './types'

import { Check } from '../../../icons/Check'
import { Line } from '../../../icons/Line'
import LabelComp from '../../Label'
import useField from '../../useField'
import { withCondition } from '../../withCondition'
import { fieldBaseClass } from '../shared'
import './index.scss'

const baseClass = 'checkbox'

export const inputBaseClass = 'checkbox-input'

const Checkbox: React.FC<Props> = (props) => {
  const {
    id,
    name,
    AfterInput,
    BeforeInput,
    Description,
    Error,
    Label: LabelFromProps,
    checked: checkedFromProps,
    className,
    disableFormData,
    label,
    onChange: onChangeFromProps,
    partialChecked,
    path: pathFromProps,
    readOnly,
    required,
    style,
    validate,
    width,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { path, setValue, showError, value } = useField({
    disableFormData,
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const onToggle = useCallback(() => {
    if (!readOnly) {
      setValue(!value)
      if (typeof onChangeFromProps === 'function') onChangeFromProps(!value)
    }
  }, [onChangeFromProps, readOnly, setValue, value])

  const checked = checkedFromProps || Boolean(value)

  const fieldID = id || `field-${path?.replace(/\./g, '__')}`

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        showError && 'error',
        className,
        value && `${baseClass}--checked`,
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
      <div
        className={[
          inputBaseClass,
          checked && `${inputBaseClass}--checked`,
          readOnly && `${inputBaseClass}--read-only`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={`${inputBaseClass}__input`}>
          {BeforeInput}
          <input
            aria-label=""
            defaultChecked={Boolean(checked)}
            disabled={readOnly}
            id={fieldID}
            name={path}
            onInput={onToggle}
            required={required}
            // ref={inputRef}
            type="checkbox"
          />
          <span
            className={[`${inputBaseClass}__icon`, !value && partialChecked ? 'check' : 'partial']
              .filter(Boolean)
              .join(' ')}
          >
            {value && <Check />}
            {!value && partialChecked && <Line />}
          </span>
          {AfterInput}
        </div>
        {Label}
      </div>
      {Description}
    </div>
  )
}

export default withCondition(Checkbox)
