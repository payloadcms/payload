'use client'
import React, { Fragment, useCallback } from 'react'

import useField from '../../useField'
import { Validate } from 'payload/types'
import { Check } from '../../../icons/Check'
import { Line } from '../../../icons/Line'

type CheckboxInputProps = {
  'aria-label'?: string
  checked?: boolean
  className?: string
  id?: string
  inputRef?: React.MutableRefObject<HTMLInputElement>
  label?: string
  name?: string
  onChange?: (value: boolean) => void
  readOnly?: boolean
  required?: boolean
  path?: string
  validate?: Validate
  partialChecked?: boolean
  iconClassName?: string
}

export const CheckboxInput: React.FC<CheckboxInputProps> = (props) => {
  const {
    id,
    name,
    'aria-label': ariaLabel,
    checked: checkedFromProps,
    className,
    iconClassName,
    inputRef,
    onChange: onChangeFromProps,
    readOnly,
    required,
    path,
    validate,
    partialChecked,
  } = props

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const { setValue, value } = useField({
    // disableFormData,
    path,
    validate: memoizedValidate,
  })

  const onToggle = useCallback(() => {
    if (!readOnly) {
      setValue(!value)
      if (typeof onChangeFromProps === 'function') onChangeFromProps(!value)
    }
  }, [onChangeFromProps, readOnly, setValue, value])

  const checked = checkedFromProps || Boolean(value)

  return (
    <Fragment>
      <input
        className={className}
        aria-label={ariaLabel}
        defaultChecked={Boolean(checked)}
        disabled={readOnly}
        id={id}
        name={name}
        onInput={onToggle}
        ref={inputRef}
        type="checkbox"
        required={required}
      />
      <span
        className={[iconClassName, !value && partialChecked ? 'check' : 'partial']
          .filter(Boolean)
          .join(' ')}
      >
        {value && <Check />}
        {!value && partialChecked && <Line />}
      </span>
    </Fragment>
  )
}
