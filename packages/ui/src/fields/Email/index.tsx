'use client'
import type {
  EmailFieldClientComponent,
  EmailFieldClientProps,
  EmailFieldValidation,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useMemo } from 'react'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import './index.scss'
import { fieldBaseClass } from '../shared/index.js'

const EmailFieldComponent: EmailFieldClientComponent = (props) => {
  const {
    field,
    field: {
      admin: {
        autoComplete,
        className,
        description,
        placeholder,
      } = {} as EmailFieldClientProps['field']['admin'],
      label,
      localized,
      required,
    } = {} as EmailFieldClientProps['field'],
    path,
    readOnly,
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

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    setValue,
    showError,
    value,
  } = useField({
    path,
    validate: memoizedValidate,
  })

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  return (
    <div
      className={[
        fieldBaseClass,
        'email',
        className,
        showError && 'error',
        (readOnly || disabled) && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={styles}
    >
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={
          <FieldLabel label={label} localized={localized} path={path} required={required} />
        }
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <RenderCustomComponent
          CustomComponent={Error}
          Fallback={<FieldError path={path} showError={showError} />}
        />
        {BeforeInput}
        {/* disable eslint here because the label is dynamic */}
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <input
          autoComplete={autoComplete}
          disabled={readOnly || disabled}
          id={`field-${path.replace(/\./g, '__')}`}
          name={path}
          onChange={setValue}
          placeholder={getTranslation(placeholder, i18n)}
          required={required}
          type="email"
          value={(value as string) || ''}
        />
        {AfterInput}
      </div>
      <RenderCustomComponent
        CustomComponent={Description}
        Fallback={<FieldDescription description={description} path={path} />}
      />
    </div>
  )
}

export const EmailField = withCondition(EmailFieldComponent)
