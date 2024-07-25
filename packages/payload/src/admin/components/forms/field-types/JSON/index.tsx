import React, { useCallback, useEffect, useState } from 'react'

import type { Props } from './types'

import { json } from '../../../../../fields/validations'
import { CodeEditor } from '../../../elements/CodeEditor'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import useField from '../../useField'
import withCondition from '../../withCondition'
import { fieldBaseClass } from '../shared'
import './index.scss'

const baseClass = 'json-field'

const JSONField: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label } = {},
      condition,
      description,
      editorOptions,
      readOnly,
      style,
      width,
    } = {},
    jsonSchema,
    label,
    path: pathFromProps,
    required,
    validate = json,
  } = props

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  const path = pathFromProps || name
  const [stringValue, setStringValue] = useState<string>()
  const [jsonError, setJsonError] = useState<string>()
  const [hasLoadedValue, setHasLoadedValue] = useState(false)

  const memoizedValidate = useCallback(
    (value, options) => {
      return validate(value, { ...options, jsonError, required })
    },
    [validate, required, jsonError],
  )

  const { errorMessage, initialValue, setValue, showError, value } = useField<string>({
    condition,
    path,
    validate: memoizedValidate,
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
    [value, jsonSchema],
  )

  const handleChange = useCallback(
    (val) => {
      try {
        if (readOnly) return
        setStringValue(val)

        setValue(val ? JSON.parse(val) : '')
        setJsonError(undefined)
      } catch (e) {
        setJsonError(e)
      }
    },
    [readOnly, setValue, setStringValue],
  )

  useEffect(() => {
    try {
      const hasValue = value && value.toString().length > 0
      if (hasLoadedValue) {
        setStringValue(hasValue ? JSON.stringify(value, null, 2) : '')
      } else {
        setStringValue(JSON.stringify(hasValue ? value : initialValue, null, 2))
        setHasLoadedValue(true)
      }
    } catch (e) {
      setJsonError(e)
    }
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
      <ErrorComp message={errorMessage} showError={showError} />
      <LabelComp htmlFor={`field-${path}`} label={label} required={required} />
      <CodeEditor
        defaultLanguage="json"
        onChange={handleChange}
        onMount={handleMount}
        options={editorOptions}
        readOnly={readOnly}
        value={stringValue}
      />
      <FieldDescription description={description} path={path} value={value} />
    </div>
  )
}

export default withCondition(JSONField)
