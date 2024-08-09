'use client'
import type { EmailFieldProps, EmailFieldValidation } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const EmailFieldComponent: React.FC<EmailFieldProps> = (props) => {
  const {
    autoComplete,
    descriptionProps,
    errorProps,
    field,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        readOnly: readOnlyFromProps,

        className,
        description,
        placeholder,
        style,
        width,
      } = {} as EmailFieldProps['field']['admin'],
      label,
      required,
    } = {} as EmailFieldProps['field'],
    labelProps,
    validate,
  } = props

  const { i18n } = useTranslation()

  const memoizedValidate: EmailFieldValidation = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { formInitializing, formProcessing, path, setValue, showError, value } = useField({
    path: pathFromContext ?? pathFromProps ?? name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  return (
    <div
      className={[fieldBaseClass, 'email', className, showError && 'error', disabled && 'read-only']
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <FieldLabel
        Label={field?.admin?.components?.Label}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError
          CustomError={field?.admin?.components?.Error}
          path={path}
          {...(errorProps || {})}
        />
        <RenderComponent mappedComponent={field?.admin?.components?.beforeInput} />
        {/* disable eslint here because the label is dynamic */}
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <input
          autoComplete={autoComplete}
          disabled={disabled}
          id={`field-${path.replace(/\./g, '__')}`}
          name={path}
          onChange={setValue}
          placeholder={getTranslation(placeholder, i18n)}
          required={required}
          type="email"
          value={(value as string) || ''}
        />
        <RenderComponent mappedComponent={field?.admin?.components?.afterInput} />
      </div>
      <FieldDescription
        Description={field?.admin?.components?.Description}
        description={description}
        {...(descriptionProps || {})}
      />
    </div>
  )
}

export const EmailField = withCondition(EmailFieldComponent)
