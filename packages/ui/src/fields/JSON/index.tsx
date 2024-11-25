'use client'
import type { JSONFieldClientComponent } from 'payload'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { CodeEditor } from '../../elements/CodeEditor/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import './index.scss'
import { fieldBaseClass } from '../shared/index.js'

const baseClass = 'json-field'

const JSONFieldComponent: JSONFieldClientComponent = (props) => {
  const {
    field,
    field: {
      admin: { className, description, editorOptions, maxHeight } = {},
      jsonSchema,
      label,
      localized,
      required,
    },
    path,
    readOnly,
    validate,
  } = props

  const [stringValue, setStringValue] = useState<string>()
  const [jsonError, setJsonError] = useState<string>()
  const [hasLoadedValue, setHasLoadedValue] = useState(false)

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, jsonError, required })
      }
    },
    [validate, required, jsonError],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    initialValue,
    setValue,
    showError,
    value,
  } = useField<string>({
    path,
    validate: memoizedValidate,
  })

  const handleMount = useCallback(
    (editor, monaco) => {
      if (!jsonSchema) {
        return
      }

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
      if (readOnly) {
        return
      }
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
    if (hasLoadedValue || value === undefined) {
      return
    }

    setStringValue(
      value || initialValue ? JSON.stringify(value ? value : initialValue, null, 2) : '',
    )

    setHasLoadedValue(true)
  }, [initialValue, value, hasLoadedValue])

  const styles = useMemo(() => mergeFieldStyles(field), [field])

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
      style={styles}
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
          Fallback={<FieldError message={jsonError} path={path} showError={showError} />}
        />
        {BeforeInput}
        <CodeEditor
          defaultLanguage="json"
          maxHeight={maxHeight}
          onChange={handleChange}
          onMount={handleMount}
          options={editorOptions}
          readOnly={readOnly}
          value={stringValue}
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

export const JSONField = withCondition(JSONFieldComponent)
