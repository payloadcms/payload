import type { SerializedEditorState } from 'lexical'

import { Error, FieldDescription, Label, useField, withCondition } from 'payload/components/forms'
import React, { useCallback } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import type { FieldProps } from '../types'

import './index.scss'
import { LexicalProvider } from './lexical/LexicalProvider'

const baseClass = 'rich-text-lexical'

const RichText: React.FC<FieldProps> = (props) => {
  const {
    name,
    admin: { className, condition, description, readOnly, style, width } = {
      className,
      condition,
      description,
      readOnly,
      style,
      width,
    },
    admin,
    defaultValue: defaultValueFromProps,
    editorConfig,
    label,
    path: pathFromProps,
    required,
    validate = null, // TODO:
  } = props

  const path = pathFromProps || name

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      return validate(value, { ...validationOptions, required })
    },
    [validate, required],
  )

  const fieldType = useField<SerializedEditorState>({
    condition,
    path,
    validate: memoizedValidate,
  })

  const { errorMessage, initialValue, setValue, showError, value } = fieldType

  const classes = [
    baseClass,
    'field-type',
    className,
    showError && 'error',
    readOnly && `${baseClass}--read-only`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__wrap`}>
        <Error message={errorMessage} showError={showError} />
        <Label htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
        <ErrorBoundary fallbackRender={fallbackRender} onReset={(details) => {}}>
          <LexicalProvider
            editorConfig={editorConfig}
            initialState={initialValue}
            onChange={(editorState, editor, tags) => {
              const json = editorState.toJSON()

              setValue(json)
            }}
            readOnly={readOnly}
            setValue={setValue}
            value={value}
          />
          <FieldDescription description={description} value={value} />
        </ErrorBoundary>
        <FieldDescription description={description} value={value} />
      </div>
    </div>
  )
}

function fallbackRender({ error }): JSX.Element {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  )
}

export default withCondition(RichText)
