'use client'

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
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'

import type { FormFieldBase } from '../shared/index.js'

export type JSONFieldProps = FormFieldBase & {
  editorOptions?: JSONFieldType['admin']['editorOptions']
  jsonSchema?: Record<string, unknown>
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
    jsonSchema,
    label,
    labelProps,
    path: pathFromProps,
    readOnly: readOnlyFromProps,
    required,
    style,
    validate,
    width,
  } = props

  const [stringValue, setStringValue] = useState<string>()
  const [hasLoadedValue, setHasLoadedValue] = useState(false)

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()
  const readOnly = readOnlyFromProps || readOnlyFromContext

  const { initialValue, path, setValue, showError, value } = useField<string>({
    path: pathFromContext || pathFromProps || name,
    validate,
  })

  const handleMount = useCallback(
    (editor, monaco) => {
      if (!jsonSchema) return

      const existingSchemas = monaco.languages.json.jsonDefaults.diagnosticsOptions.schemas || []
      const modelUri = monaco.Uri.parse(jsonSchema.uri)

      const model = monaco.editor.createModel(JSON.stringify(value, null, 2), 'json', modelUri)
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        enableSchemaRequest: true,
        schemas: [...existingSchemas, jsonSchema],
        validate: true,
      })

      editor.setModel(model)
    },
    [jsonSchema, value],
  )

  const handleChange = useCallback(
    (val) => {
      if (readOnly) return
      setStringValue(val)

      try {
        setValue(val ? JSON.parse(val) : null)
      } catch (e) {
        setValue(val ? val : null)
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
          defaultLanguage="json"
          onChange={handleChange}
          onMount={handleMount}
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
