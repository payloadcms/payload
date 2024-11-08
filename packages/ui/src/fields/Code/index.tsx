'use client'
import type { CodeFieldClientComponent } from 'payload'

import React, { useCallback } from 'react'

import { CodeEditor } from '../../elements/CodeEditor/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
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
    field: {
      name,
      admin: {
        className,
        description,
        editorOptions = {},
        language = 'javascript',
        style,
        width,
      } = {},
      label,
      localized,
      required,
    },
    path: pathFromProps,
    readOnly,
    validate,
  } = props
  const path = pathFromProps ?? name

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    setValue,
    showError,
    value,
  } = useField({
    path,
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
        <CodeEditor
          defaultLanguage={prismToMonacoLanguageMap[language] || language}
          onChange={readOnly ? () => null : (val) => setValue(val)}
          options={editorOptions}
          readOnly={readOnly}
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

export const CodeField = withCondition(CodeFieldComponent)
