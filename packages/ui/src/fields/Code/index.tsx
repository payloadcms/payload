'use client'
import type { CodeFieldClientComponent } from 'payload'

import React, { useCallback } from 'react'

import { CodeEditor } from '../../elements/CodeEditor/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
}

const baseClass = 'code-field'

const CodeFieldComponent: CodeFieldClientComponent = (props) => {
  const {
    AfterInput,
    BeforeInput,
    Description,
    Error,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        className,
        editorOptions = {},
        language = 'javascript',
        readOnly: readOnlyFromAdmin,
        style,
        width,
      } = {},
      required,
    },
    Label,
    readOnly: readOnlyFromTopLevelProps,
    validate,
  } = props

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

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
      {Label}
      <div className={`${fieldBaseClass}__wrap`}>
        {Error}
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
      {Description}
    </div>
  )
}

export const CodeField = withCondition(CodeFieldComponent)
