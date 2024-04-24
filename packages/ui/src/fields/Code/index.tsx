/* eslint-disable react/destructuring-assignment */
'use client'
import type { CodeField as CodeFieldType, FieldBase } from 'payload/types'

import { FieldDescription } from '@payloadcms/ui/forms/FieldDescription'
import { FieldError } from '@payloadcms/ui/forms/FieldError'
import { FieldLabel } from '@payloadcms/ui/forms/FieldLabel'
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import React from 'react'

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

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()
  const readOnly = readOnlyFromProps || readOnlyFromContext

  const { path, setValue, showError, value } = useField({
    path: pathFromContext || pathFromProps || name,
    validate,
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
      <FieldError CustomError={CustomError} path={path} {...(errorProps || {})} />
      <FieldLabel
        CustomLabel={CustomLabel}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
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
