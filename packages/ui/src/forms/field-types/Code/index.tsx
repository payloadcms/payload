'use client'
import React, { useCallback } from 'react'

import type { Props } from './types'
import { CodeEditor } from '../../../elements/CodeEditor'
import useField from '../../useField'
import { fieldBaseClass } from '../shared'
import { withCondition } from '../../withCondition'

import './index.scss'

const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
}

const baseClass = 'code-field'

const Code: React.FC<Props> = (props) => {
  const {
    name,
    className,
    readOnly,
    style,
    width,
    path: pathFromProps,
    required,
    Error,
    Label,
    Description,
    BeforeInput,
    AfterInput,
    validate,
  } = props

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

  const { setValue, value, path, showError } = useField({
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
