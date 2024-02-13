'use client'
import React, { useCallback } from 'react'

import type { Props } from './types'
import { fieldBaseClass } from '../shared'
import { withCondition } from '../../withCondition'
import { Validate } from 'payload/types'
import useField from '../../useField'
import { Check } from '../../../icons/Check'
import { Line } from '../../../icons/Line'
import LabelComp from '../../Label'

import './index.scss'

const baseClass = 'checkbox'

export const inputBaseClass = 'checkbox-input'

const Checkbox: React.FC<Props> = (props) => {
  const {
    className,
    readOnly,
    style,
    width,
    required,
    validate,
    BeforeInput,
    AfterInput,
    Label: LabelFromProps,
    label,
    Error,
    Description,
    onChange: onChangeFromProps,
    partialChecked,
    checked: checkedFromProps,
    disableFormData,
    id,
    path: pathFromProps,
    name,
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

  const { setValue, value, showError, path } = useField({
    disableFormData,
    validate: memoizedValidate,
    path: pathFromProps || name,
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
            // ref={inputRef}
            type="checkbox"
            required={required}
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
