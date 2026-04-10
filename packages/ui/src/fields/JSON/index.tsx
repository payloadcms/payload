'use client'
import type { JSONFieldClientComponent, JsonObject } from 'payload'

import { type OnMount } from '@monaco-editor/react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { defaultOptions } from '../../elements/CodeEditor/constants.js'
import { CodeEditor } from '../../elements/CodeEditor/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

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
    path: pathFromProps,
    readOnly,
    validate,
  } = props

  const { insertSpaces = defaultOptions.insertSpaces, tabSize = defaultOptions.tabSize } =
    editorOptions || {}

  const formatJSON = useCallback(
    (value: JsonObject | undefined): string | undefined => {
      if (value === undefined) {
        return undefined
      }
      if (value === null) {
        return ''
      }
      return insertSpaces ? JSON.stringify(value, null, tabSize) : JSON.stringify(value, null, '\t')
    },
    [tabSize, insertSpaces],
  )

  const [jsonError, setJsonError] = useState<string>()
  const inputChangeFromRef = React.useRef<'formState' | 'internalEditor'>('formState')
  const [recalculatedHeightAt, setRecalculatedHeightAt] = useState<number | undefined>(Date.now())

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
    disabled,
    initialValue,
    path,
    setValue,
    showError,
    value,
  } = useField<JsonObject>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate,
  })

  const stringValueRef = React.useRef<string>(formatJSON(value ?? initialValue))

  const handleMount = useCallback<OnMount>(
    (editor, monaco) => {
      if (!jsonSchema) {
        return
      }

      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        enableSchemaRequest: true,
        schemas: [
          ...(monaco.languages.json.jsonDefaults.diagnosticsOptions.schemas || []),
          jsonSchema,
        ],
        validate: true,
      })

      const uri = jsonSchema.uri
      const newUri = uri.includes('?')
        ? `${uri}&${crypto.randomUUID ? crypto.randomUUID() : uuidv4()}`
        : `${uri}?${crypto.randomUUID ? crypto.randomUUID() : uuidv4()}`

      editor.setModel(
        monaco.editor.createModel(formatJSON(value) || '', 'json', monaco.Uri.parse(newUri)),
      )
    },
    [jsonSchema, formatJSON, value],
  )

  const handleChange = useCallback(
    (val: string) => {
      if (readOnly || disabled) {
        return
      }
      inputChangeFromRef.current = 'internalEditor'

      try {
        setValue(val ? JSON.parse(val) : null)
        stringValueRef.current = val
        setJsonError(undefined)
      } catch (e) {
        setValue(val ? val : null)
        stringValueRef.current = val
        setJsonError(e)
      }
    },
    [readOnly, disabled, setValue],
  )

  useEffect(() => {
    if (inputChangeFromRef.current === 'formState') {
      const newStringValue = formatJSON(value ?? initialValue)
      if (newStringValue !== stringValueRef.current) {
        stringValueRef.current = newStringValue
        setRecalculatedHeightAt(Date.now())
      }
    }

    inputChangeFromRef.current = 'formState'
  }, [initialValue, path, formatJSON, value])

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        (readOnly || disabled) && 'read-only',
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
          readOnly={readOnly || disabled}
          recalculatedHeightAt={recalculatedHeightAt}
          value={stringValueRef.current}
          wrapperProps={{
            id: `field-${path?.replace(/\./g, '__')}`,
          }}
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
