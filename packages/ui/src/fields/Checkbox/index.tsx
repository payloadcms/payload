'use client'
import type {
  CheckboxFieldClientComponent,
  CheckboxFieldClientProps,
  CheckboxFieldValidation,
} from 'payload'

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
import './index.scss'
import { CheckboxInput } from './Input.js'

const baseClass = 'checkbox'

export { CheckboxFieldClientProps, CheckboxInput, type CheckboxInputProps }

const CheckboxFieldComponent: CheckboxFieldClientComponent = (props) => {
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
        readOnly: readOnlyFromAdmin,
        style,
        width,
      } = {} as CheckboxFieldClientProps['field']['admin'],
      label,
      required,
    } = {} as CheckboxFieldClientProps['field'],
    labelProps,
    onChange: onChangeFromProps,
    partialChecked,
    readOnly: readOnlyFromTopLevelProps,
    validate,
  } = props
  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

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
      if (typeof onChangeFromProps === 'function') {
        onChangeFromProps(!value)
      }
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
        field={field}
        path={path}
        {...(errorProps || {})}
        alignCaret="left"
      />
      <CheckboxInput
        afterInput={field?.admin?.components?.afterInput}
        beforeInput={field?.admin?.components?.beforeInput}
        checked={checked}
        field={field}
        id={fieldID}
        inputRef={null}
        Label={field?.admin?.components?.Label}
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
        field={field}
        {...(descriptionProps || {})}
      />
    </div>
  )
}

export const CheckboxField = withCondition(CheckboxFieldComponent)
