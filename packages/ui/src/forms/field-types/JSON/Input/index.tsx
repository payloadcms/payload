'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { JSONField, Validate } from 'payload/types'
import { CodeEditor } from '../../../../elements/CodeEditor'
import useField from '../../../useField'

export const JSONInput: React.FC<{
  path: string
  required?: boolean
  min?: number
  max?: number
  placeholder?: Record<string, string> | string
  readOnly?: boolean
  step?: number
  hasMany?: boolean
  name?: string
  validate?: Validate
  editorOptions?: JSONField['admin']['editorOptions']
}> = (props) => {
  const { name, path: pathFromProps, required, validate, readOnly, editorOptions } = props

  const path = pathFromProps || name
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

  const { initialValue, setValue, value } = useField<string>({
    path,
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
    <CodeEditor
      defaultLanguage="json"
      onChange={handleChange}
      options={editorOptions}
      readOnly={readOnly}
      value={stringValue}
    />
  )
}
