/* eslint-disable react/destructuring-assignment */
'use client'
import React, { useCallback } from 'react'

import type { Props } from './types.js'

import { CodeEditor } from '../../../elements/CodeEditor/index.js'
import LabelComp from '../../Label/index.js'
import { useField } from '../../useField/index.js'
import { withCondition } from '../../withCondition/index.js'
import { fieldBaseClass } from '../shared.js'
import './index.scss'

const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
}

const baseClass = 'code-field'

const Code: React.FC<Props> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    Description,
    Error,
    Label: LabelFromProps,
    className,
    label,
    path: pathFromProps,
    readOnly,
    required,
    style,
    validate,
    width,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const editorOptions = 'editorOptions' in props ? props.editorOptions : {}
  const language = 'language' in props ? props.language : 'javascript'

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { path, setValue, showError, value } = useField({
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
      {Error}
      {Label}
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
      {Description}
    </div>
  )
}

export default withCondition(Code)
