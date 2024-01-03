'use client'
import React, { useCallback } from 'react'

import './index.scss'
import useField from '../../useField'

const baseClass = 'checkbox-input'

type CheckboxInputProps = {
  'aria-label'?: string
  checked?: boolean
  className?: string
  id?: string
  inputRef?: React.MutableRefObject<HTMLInputElement>
  label?: string
  name?: string
  onChange?: (value: boolean) => void
  partialChecked?: boolean
  readOnly?: boolean
  required?: boolean
  path: string
}

export const CheckboxInput: React.FC<CheckboxInputProps> = (props) => {
  const {
    id,
    name,
    'aria-label': ariaLabel,
    checked: checkedFromProps,
    className,
    inputRef,
    onChange: onChangeFromProps,
    readOnly,
    required,
    path,
  } = props

  // const memoizedValidate = useCallback(
  //   (value, options) => {
  //     return validate(value, { ...options, required })
  //   },
  //   [validate, required],
  // )

  const { errorMessage, setValue, showError, value } = useField({
    // disableFormData,
    path,
    // validate: memoizedValidate,
  })

  const onToggle = useCallback(() => {
    if (!readOnly) {
      setValue(!value)
      if (typeof onChangeFromProps === 'function') onChangeFromProps(!value)
    }
  }, [onChangeFromProps, readOnly, setValue, value])

  const checked = checkedFromProps || Boolean(value)

  return (
    <input
      className={className}
      aria-label={ariaLabel}
      defaultChecked={checked}
      disabled={readOnly}
      id={id}
      name={name}
      onInput={onToggle}
      ref={inputRef}
      type="checkbox"
      required={required}
    />
  )
}
