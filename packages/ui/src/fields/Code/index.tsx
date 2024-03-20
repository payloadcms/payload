/* eslint-disable react/destructuring-assignment */
'use client'
import type { CodeField as CodeFieldType, FieldBase } from 'payload/types'

import { FieldDescription } from '@payloadcms/ui/forms/FieldDescription'
import { FieldError } from '@payloadcms/ui/forms/FieldError'
import { FieldLabel } from '@payloadcms/ui/forms/FieldLabel'
import React, { useCallback } from 'react'

import type { FormFieldBase } from '../shared/index.js'

import { CodeEditor } from '../../elements/CodeEditor/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export type CodeFieldProps = FormFieldBase & {
  editorOptions?: CodeFieldType['admin']['editorOptions']
  label?: FieldBase['label']
  language?: CodeFieldType['admin']['language']
  name?: string
  path?: string
  width: string
}

const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
}

const baseClass = 'code-field'

const CodeField: React.FC<CodeFieldProps> = (props) => {
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
    labelProps,
    language = 'javascript',
    path: pathFromProps,
    readOnly,
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

  const { setValue, showError, value } = useField({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        readOnly && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      {CustomError !== undefined ? CustomError : <FieldError {...(errorProps || {})} />}
      {CustomLabel !== undefined ? CustomLabel : <FieldLabel {...(labelProps || {})} />}
      <div>
        {BeforeInput}
        <CodeEditor
          defaultLanguage={prismToMonacoLanguageMap[language] || language}
          onChange={readOnly ? () => null : (val) => setValue(val)}
          options={editorOptions}
          readOnly={readOnly}
          value={(value as string) || ''}
        />
        {AfterInput}
      </div>
      {CustomDescription ? CustomDescription : <FieldDescription {...(descriptionProps || {})} />}
    </div>
  )
}

export const Code = withCondition(CodeField)
