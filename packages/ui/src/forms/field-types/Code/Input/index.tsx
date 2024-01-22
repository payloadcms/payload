'use client'
import React, { useCallback } from 'react'

import useField from '../../../useField'
import { CodeField, Validate } from 'payload/types'
import { CodeEditor } from '../../../../elements/CodeEditor'

const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
}

export const CodeInput: React.FC<{
  path: string
  required?: boolean
  placeholder?: Record<string, string> | string
  readOnly?: boolean
  name?: string
  validate?: Validate
  language?: string
  editorOptions?: CodeField['admin']['editorOptions']
}> = (props) => {
  const { name, readOnly, path: pathFromProps, required, validate, language, editorOptions } = props

  const path = pathFromProps || name

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { setValue, value } = useField({
    path,
    validate: memoizedValidate,
  })

  return (
    <CodeEditor
      defaultLanguage={prismToMonacoLanguageMap[language] || language}
      onChange={readOnly ? () => null : (val) => setValue(val)}
      options={editorOptions}
      readOnly={readOnly}
      value={(value as string) || ''}
    />
  )
}
