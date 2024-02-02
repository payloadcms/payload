'use client'
import React, { useCallback, useEffect, useState } from 'react'

import type { Props } from './types'

import { fieldBaseClass } from '../shared'
import { CodeEditor } from '../../../elements/CodeEditor'
import { Validate } from 'payload/types'
import useField from '../../useField'
import { withCondition } from '../../withCondition'

import './index.scss'

const baseClass = 'json-field'

const JSONField: React.FC<Props> = (props) => {
  const {
    name,
    className,
    readOnly,
    style,
    width,
    path: pathFromProps,
    Error,
    Label,
    Description,
    BeforeInput,
    AfterInput,
    validate,
    required,
  } = props

  const editorOptions = 'editorOptions' in props ? props.editorOptions : {}

  const [stringValue, setStringValue] = useState<string>()
  const [jsonError, setJsonError] = useState<string>()
  const [hasLoadedValue, setHasLoadedValue] = useState(false)

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function')
        return validate(value, { ...options, jsonError, required })
    },
    [validate, required],
  )

  const { initialValue, setValue, value, path, showError } = useField<string>({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const handleChange = useCallback(
    (val) => {
      if (readOnly) return
      setStringValue(val)

      try {
        setValue(JSON.parse(val))
        setJsonError(undefined)
      } catch (e) {
        setJsonError(e)
      }
    },
    [readOnly, setValue, setStringValue],
  )

  useEffect(() => {
    if (hasLoadedValue) return
    setStringValue(JSON.stringify(value ? value : initialValue, null, 2))
    setHasLoadedValue(true)
  }, [initialValue, value])

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
          defaultLanguage="json"
          onChange={handleChange}
          options={editorOptions}
          readOnly={readOnly}
          value={stringValue}
        />
        {AfterInput}
      </div>
      {Description}
    </div>
  )
}

export default withCondition(JSONField)
