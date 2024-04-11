import React, { useCallback, useEffect, useState } from 'react'

import type { Props } from './types'

import { json } from '../../../../../fields/validations'
import { CodeEditor } from '../../../elements/CodeEditor'
import { useDocumentInfo } from '../../../utilities/DocumentInfo'
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
      schema,
      style,
      width,
    } = {},
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
  const { id } = useDocumentInfo()

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

  function handleMount(editor, monaco) {
    const existingSchemas = monaco.languages.json.jsonDefaults.diagnosticsOptions.schemas || []
    const schemas = []

    const fieldId = `field-${path?.replace(/\./g, '__')}`
    const jsonUri = `payload://json/schema/${id}/${fieldId}`
    const modelUri = monaco.Uri.parse(jsonUri)

    const initialModelValue = JSON.stringify(value, null, 2)

    const model = monaco.editor.createModel(initialModelValue, 'json', modelUri)

    const monacoFormattedSchemas = schema.map((initialSchema) => {
      const schemaProperties = {}
      Object.keys(initialSchema).forEach((key) => {
        schemaProperties[key] = { enum: initialSchema[key] }
      })

      return Object.assign(
        {
          fileMatch: [modelUri.toString()],
          schema: { type: 'object', properties: schemaProperties },
          uri: modelUri.toString(),
        },
        {},
      )
    })

    monacoFormattedSchemas.forEach((formattedSchema) => {
      if (!existingSchemas.map(({ uri }) => uri).includes(jsonUri)) {
        schemas.push(formattedSchema)
      }
    })

    existingSchemas.forEach((existingSchema) => {
      if (!schemas.map(({ uri }) => uri).includes(existingSchema.uri)) {
        schemas.push(existingSchema)
      }
    })

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      schemas,
      validate: true,
    })

    editor.setModel(model)
  }

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
