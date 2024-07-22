'use client'
import type { CodeField as CodeFieldType } from 'payload'

import React, { useCallback } from 'react'

import type { FormFieldBase } from '../shared/index.js'

import { CodeEditor } from '../../elements/CodeEditor/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export type CodeFieldProps = {
  editorOptions?: CodeFieldType['admin']['editorOptions']
  language?: CodeFieldType['admin']['language']
  name?: string
  path?: string
  width: string
} & FormFieldBase

const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
}

const baseClass = 'code-field'

const _CodeField: React.FC<CodeFieldProps> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    CustomDescription,
    CustomError,
    CustomLabel,
    className,
    descriptionProps,
    editorOptions = {},
    errorProps,
    label,
    labelProps,
    language = 'javascript',
    path: pathFromProps,
    readOnly: readOnlyFromProps,
    required,
    style,
    validate,
    width,
  } = props

  const memoizedValidate = useCallback(
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
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        disabled && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <FieldLabel
        CustomLabel={CustomLabel}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError CustomError={CustomError} path={path} {...(errorProps || {})} />
        {BeforeInput}
        <CodeEditor
          defaultLanguage={prismToMonacoLanguageMap[language] || language}
          onChange={disabled ? () => null : (val) => setValue(val)}
          options={editorOptions}
          readOnly={disabled}
          value={(value as string) || ''}
        />
        {AfterInput}
      </div>
      {CustomDescription ? CustomDescription : <FieldDescription {...(descriptionProps || {})} />}
    </div>
  )
}

export const CodeField = withCondition(_CodeField)
