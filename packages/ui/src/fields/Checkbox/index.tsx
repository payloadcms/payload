'use client'
import type { ClientValidate } from 'payload/types'

import { FieldDescription } from '@payloadcms/ui/forms/FieldDescription'
import { FieldError } from '@payloadcms/ui/forms/FieldError'
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import React, { useCallback } from 'react'

import type { CheckboxFieldProps } from './types.js'

import { useForm } from '../../forms/Form/context.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { generateFieldID } from '../../utilities/generateFieldID.js'
import { fieldBaseClass } from '../shared/index.js'
import { CheckboxInput } from './Input.js'
import './index.scss'

const baseClass = 'checkbox'

export { CheckboxFieldProps, CheckboxInput }

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

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()
  const readOnly = readOnlyFromProps || readOnlyFromContext

  const { path, setValue, showError, value } = useField({
    disableFormData,
    path: pathFromContext || pathFromProps || name,
    validate,
  })

  const onToggle = useCallback(() => {
    if (!readOnly) {
      setValue(!value)
      if (typeof onChangeFromProps === 'function') onChangeFromProps(!value)
    }
  }, [onChangeFromProps, readOnly, setValue, value])

  const checked = checkedFromProps || Boolean(value)

  const fieldID = id || generateFieldID(path, uuid)

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
      <div className={`${baseClass}__error-wrap`}>
        <FieldError CustomError={CustomError} path={path} {...(errorProps || {})} />
      </div>
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
        readOnly={readOnly}
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
