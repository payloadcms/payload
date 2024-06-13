'use client'
import type { ClientValidate } from 'payload'

import React, { useCallback } from 'react'

import type { CheckboxInputProps } from './Input.js'
import type { CheckboxFieldProps } from './types.js'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useForm } from '../../forms/Form/context.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { generateFieldID } from '../../utilities/generateFieldID.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { fieldBaseClass } from '../shared/index.js'
import { CheckboxInput } from './Input.js'
import './index.scss'

const baseClass = 'checkbox'

export { CheckboxFieldProps, CheckboxInput, type CheckboxInputProps }

const CheckboxField: React.FC<CheckboxFieldProps> = (props) => {
  const {
    id,
    name,
    AfterInput,
    BeforeInput,
    CustomDescription,
    CustomError,
    CustomLabel,
    checked: checkedFromProps,
    className,
    descriptionProps,
    disableFormData,
    errorProps,
    label,
    labelProps,
    onChange: onChangeFromProps,
    partialChecked,
    path: pathFromProps,
    readOnly: readOnlyFromProps,
    required,
    style,
    validate,
    width,
  } = props

  const { uuid } = useForm()

  const editDepth = useEditDepth()

  const memoizedValidate: ClientValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { formInitializing, formProcessing, path, setValue, showError, value } = useField({
    disableFormData,
    path: pathFromContext || pathFromProps || name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  const onToggle = useCallback(() => {
    if (!disabled) {
      setValue(!value)
      if (typeof onChangeFromProps === 'function') onChangeFromProps(!value)
    }
  }, [onChangeFromProps, disabled, setValue, value])

  const checked = checkedFromProps || Boolean(value)

  const fieldID = id || generateFieldID(path, editDepth, uuid)

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        showError && 'error',
        className,
        value && `${baseClass}--checked`,
        disabled && `${baseClass}--read-only`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <FieldError CustomError={CustomError} path={path} {...(errorProps || {})} />
      <CheckboxInput
        AfterInput={AfterInput}
        BeforeInput={BeforeInput}
        CustomLabel={CustomLabel}
        checked={checked}
        id={fieldID}
        inputRef={null}
        label={label}
        labelProps={labelProps}
        name={path}
        onToggle={onToggle}
        partialChecked={partialChecked}
        readOnly={disabled}
        required={required}
      />
      {CustomDescription !== undefined ? (
        CustomDescription
      ) : (
        <FieldDescription {...(descriptionProps || {})} />
      )}
    </div>
  )
}

export const Checkbox = withCondition(CheckboxField)
