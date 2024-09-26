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
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'
import { CheckboxInput } from './Input.js'

const baseClass = 'checkbox'

export { CheckboxFieldClientProps, CheckboxInput, type CheckboxInputProps }

const CheckboxFieldComponent: CheckboxFieldClientComponent = (props) => {
  const {
    id,
    AfterInput,
    BeforeInput,
    checked: checkedFromProps,
    Description,
    disableFormData,
    Error,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        className,
        readOnly: readOnlyFromAdmin,
        style,
        width,
      } = {} as CheckboxFieldClientProps['field']['admin'],
      required,
    } = {} as CheckboxFieldClientProps['field'],
    Label,
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
      {Error}
      <CheckboxInput
        AfterInput={AfterInput}
        BeforeInput={BeforeInput}
        checked={checked}
        id={fieldID}
        inputRef={null}
        Label={Label}
        name={path}
        onToggle={onToggle}
        partialChecked={partialChecked}
        readOnly={disabled}
        required={required}
      />
      {Description}
    </div>
  )
}

export const CheckboxField = withCondition(CheckboxFieldComponent)
