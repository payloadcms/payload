'use client'
import type { ClientValidate } from 'payload/types'

import React, { useCallback, useEffect, useState } from 'react'

import { CodeEditor } from '../../elements/CodeEditor/index.js'
import { Label as LabelComp } from '../../forms/Label/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { fieldBaseClass } from '../shared.js'
import './index.scss'

const baseClass = 'json-field'

import type { FieldBase, JSONField as JSONFieldType } from 'payload/types'

import type { FormFieldBase } from '../shared.js'

export type JSONFieldProps = FormFieldBase & {
  editorOptions?: JSONFieldType['admin']['editorOptions']
  label?: FieldBase['label']
  name?: string
  path?: string
  width?: string
}

const JSONFieldComponent: React.FC<JSONFieldProps> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    Description,
    Error,
    Label: LabelFromProps,
    className,
    editorOptions,
    label,
    path: pathFromProps,
    readOnly,
    required,
    style,
    validate,
    width,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const [stringValue, setStringValue] = useState<string>()
  const [jsonError, setJsonError] = useState<string>()
  const [hasLoadedValue, setHasLoadedValue] = useState(false)

  const memoizedValidate: ClientValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function')
        return validate(value, { ...options, jsonError, required })
    },
    [validate, required, jsonError],
  )

  const {
    initialValue,
    // path,
    setValue,
    showError,
    value,
  } = useField<string>({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const handleChange = useCallback(
    (val) => {
      if (readOnly) return
      setStringValue(val)

      try {
        setValue(val ? JSON.stringify(JSON.parse(val)) : null)
        setJsonError(undefined)
      } catch (e) {
        setValue(val ? val : null)
        setJsonError(e)
      }
    },
    [readOnly, setValue, setStringValue],
  )

  useEffect(() => {
    if (hasLoadedValue) return
    setStringValue(
      value || initialValue ? JSON.stringify(value ? value : initialValue, null, 2) : '',
    )
    setHasLoadedValue(true)
  }, [initialValue, value, hasLoadedValue])

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

export const JSONField = withCondition(JSONFieldComponent)
