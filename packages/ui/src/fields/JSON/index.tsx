'use client'
import type { JSONFieldProps } from 'payload'

import React, { useCallback, useEffect, useState } from 'react'

import { CodeEditor } from '../../elements/CodeEditor/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const baseClass = 'json-field'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'

const JSONFieldComponent: React.FC<JSONFieldProps> = (props) => {
  const {
    descriptionProps,
    errorProps,
    field,
    field: {
      name,
      _path: pathFromProps,
      admin: { className, description, editorOptions, readOnly: readOnlyFromProps, style, width },
      jsonSchema,
      label,
      required,
    },
    labelProps,
    validate,
  } = props

  const [stringValue, setStringValue] = useState<string>()
  const [jsonError, setJsonError] = useState<string>()
  const [hasLoadedValue, setHasLoadedValue] = useState(false)

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function')
        return validate(value, { ...options, jsonError, required })
    },
    [validate, required, jsonError],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { formInitializing, formProcessing, initialValue, path, setValue, showError, value } =
    useField<string>({
      path: pathFromContext ?? pathFromProps ?? name,
      validate: memoizedValidate,
    })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

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
      if (disabled) return
      setStringValue(val)

      try {
        setValue(val ? JSON.parse(val) : null)
        setJsonError(undefined)
      } catch (e) {
        setValue(val ? val : null)
        setJsonError(e)
      }
    },
    [disabled, setValue, setStringValue],
  )

  useEffect(() => {
    if (hasLoadedValue || value === undefined) return

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
        disabled && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <FieldLabel
        Label={field?.admin?.components?.Label}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError
          CustomError={field?.admin?.components?.Error}
          path={path}
          {...(errorProps || {})}
        />
        <RenderComponent mappedComponent={field?.admin?.components?.beforeInput} />
        <CodeEditor
          defaultLanguage="json"
          onChange={handleChange}
          onMount={handleMount}
          options={editorOptions}
          readOnly={disabled}
          value={stringValue}
        />
        <RenderComponent mappedComponent={field?.admin?.components?.afterInput} />
      </div>
      <FieldDescription
        Description={field?.admin?.components?.Description}
        description={description}
        {...(descriptionProps || {})}
      />
    </div>
  )
}

export const JSONField = withCondition(JSONFieldComponent)
