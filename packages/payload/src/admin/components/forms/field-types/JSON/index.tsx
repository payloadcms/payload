import React, { useCallback, useEffect, useState, useRef } from 'react'

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
    label,
    path: pathFromProps,
    required,
    schema,
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

  function handleEditorDidMount(editor, monaco) {
    // monaco.editor.getModels().forEach((mdl) => mdl.dispose()) // remove all previous models
    const modelUri = monaco.Uri.parse(
      `payload://json/schema/${Math.ceil(Math.random() * 99999)}.json`, // TODO: this id should be unique but follow a pattern
    )
    const model = monaco.editor.createModel(stringValue, 'json', modelUri)

    // TODO: build this array of schemas using [a config schema]
    const schemas = schema.map((sch) => {
      sch.fileMatch = [modelUri.toString()]
      sch.uri = modelUri.toString()
      return sch
    })

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      schemas: [
        {
          fileMatch: [modelUri.toString()], // associate with our model
          schema: {
            type: 'object',
            properties: {
              test: {
                enum: ['string to test ok', 'ok', 'still ok'],
              },
            },
          },
          uri: modelUri.toString(), // id of the first schema
        },
      ],
      validate: true,
    })
    console.log('DEBUG:', editor, modelUri.toString())
    editor.setModel(model) // add updated model
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
        // beforeMount={handleEditorWillMount}
        defaultLanguage="json"
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={editorOptions}
        readOnly={readOnly}
        value={stringValue}
      />
      <FieldDescription description={description} path={path} value={value} />
    </div>
  )
}

export default withCondition(JSONField)
