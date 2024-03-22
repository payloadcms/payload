'use client'
import type { ClientValidate } from 'payload/types'

import React, { useCallback, useEffect, useState } from 'react'

import { CodeEditor } from '../../elements/CodeEditor/index.js'
import { FieldLabel } from '../../forms/FieldLabel/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const baseClass = 'json-field'

import type { FieldBase, JSONField as JSONFieldType } from 'payload/types'

import { FieldDescription } from '@payloadcms/ui/forms/FieldDescription'
import { FieldError } from '@payloadcms/ui/forms/FieldError'

import type { FormFieldBase } from '../shared/index.js'

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
    CustomDescription,
    CustomError,
    CustomLabel,
    className,
    descriptionProps,
    editorOptions,
    errorProps,
    labelProps,
    path: pathFromProps,
    readOnly,
    required,
    style,
    validate,
    width,
  } = props

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
        setValue(val ? JSON.parse(val) : null)
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
      <FieldError CustomError={CustomError} {...(errorProps || {})} />
      <FieldLabel CustomLabel={CustomLabel} {...(labelProps || {})} />
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
      {CustomDescription !== undefined ? (
        CustomDescription
      ) : (
        <FieldDescription {...(descriptionProps || {})} />
      )}
    </div>
  )
}

export const JSONField = withCondition(JSONFieldComponent)
