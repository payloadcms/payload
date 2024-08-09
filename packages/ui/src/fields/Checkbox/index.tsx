'use client'
import type { CheckboxFieldProps, CheckboxFieldValidation } from 'payload'

import React, { useCallback } from 'react'

import type { CheckboxInputProps } from './Input.js'

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

const CheckboxFieldComponent: React.FC<CheckboxFieldProps> = (props) => {
  const {
    id,
    checked: checkedFromProps,
    descriptionProps,
    disableFormData,
    errorProps,
    field,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        className,
        description,
        readOnly: readOnlyFromProps,
        style,
        width,
      } = {} as CheckboxFieldProps['field']['admin'],
      label,
      required,
    } = {} as CheckboxFieldProps['field'],
    labelProps,
    onChange: onChangeFromProps,
    partialChecked,
    validate,
  } = props

  const { uuid } = useForm()

  const editDepth = useEditDepth()

  const memoizedValidate: CheckboxFieldValidation = useCallback(
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
    path: pathFromContext ?? pathFromProps ?? name,
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
      <FieldError
        CustomError={field?.admin?.components?.Error}
        path={path}
        {...(errorProps || {})}
        alignCaret="left"
      />
      <CheckboxInput
        Label={field?.admin?.components?.Label}
        afterInput={field?.admin?.components?.afterInput}
        beforeInput={field?.admin?.components?.beforeInput}
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
      <FieldDescription
        Description={field?.admin?.components?.Description}
        description={description}
        {...(descriptionProps || {})}
      />
    </div>
  )
}

export const CheckboxField = withCondition(CheckboxFieldComponent)
