'use client'
import type {
  CheckboxFieldClientComponent,
  CheckboxFieldClientProps,
  CheckboxFieldValidation,
} from 'payload'

import React, { useCallback } from 'react'

import type { CheckboxInputProps } from './Input.js'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
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
    checked: checkedFromProps,
    disableFormData,
    field: {
      name,
      admin: {
        className,
        description,
        style,
        width,
      } = {} as CheckboxFieldClientProps['field']['admin'],
      label,
      required,
    } = {} as CheckboxFieldClientProps['field'],
    fieldState: {
      customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    } = {},
    onChange: onChangeFromProps,
    partialChecked,
    path: pathFromProps,
    readOnly,
    validate,
  } = props
  const path = pathFromProps || name

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

  const { setValue, showError, value } = useField({
    disableFormData,
    path,
    validate: memoizedValidate,
  })

  const onToggle = useCallback(() => {
    if (!readOnly) {
      setValue(!value)
      if (typeof onChangeFromProps === 'function') {
        onChangeFromProps(!value)
      }
    }
  }, [onChangeFromProps, readOnly, setValue, value])

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
        readOnly && `${baseClass}--read-only`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <RenderCustomComponent
        CustomComponent={Error}
        Fallback={<FieldError path={path} showError={showError} />}
      />
      <CheckboxInput
        AfterInput={AfterInput}
        BeforeInput={BeforeInput}
        checked={checked}
        id={fieldID}
        inputRef={null}
        Label={Label}
        label={label}
        name={path}
        onToggle={onToggle}
        partialChecked={partialChecked}
        readOnly={readOnly}
        required={required}
      />
      <RenderCustomComponent
        CustomComponent={Description}
        Fallback={<FieldDescription description={description} path={path} />}
      />
    </div>
  )
}

export const CheckboxField = withCondition(CheckboxFieldComponent)
