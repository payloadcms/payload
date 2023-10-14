import type { SerializedEditorState } from 'lexical'

import { Error, FieldDescription, Label, useField, withCondition } from 'payload/components/forms'
import React, { useCallback } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import type { FieldProps } from '../types'

import { defaultRichTextValueV2 } from '../populate/defaultValue'
import { richTextValidateHOC } from '../validate'
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
    defaultValue: defaultValueFromProps,
    editorConfig,
    label,
    path: pathFromProps,
    required,
    validate = richTextValidateHOC({ editorConfig }),
  } = props

  const path = pathFromProps || name

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      return validate(value, { ...validationOptions, props, required })
    },
    [validate, required, props],
  )

  const fieldType = useField<SerializedEditorState>({
    condition,
    path,
    validate: memoizedValidate,
  })

  const { errorMessage, initialValue, setValue, showError, value } = fieldType

  let valueToUse = value

  if (typeof valueToUse === 'string') {
    try {
      const parsedJSON = JSON.parse(valueToUse)
      valueToUse = parsedJSON
    } catch (err) {
      valueToUse = null
    }
  }

  if (!valueToUse) valueToUse = defaultValueFromProps || defaultRichTextValueV2

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
            fieldProps={props}
            initialState={initialValue}
            onChange={(editorState, editor, tags) => {
              let serializedEditorState = editorState.toJSON()

              // Transform state through save hooks
              if (editorConfig?.features?.hooks?.save?.length) {
                editorConfig.features.hooks.save.forEach((hook) => {
                  serializedEditorState = hook({ incomingEditorState: serializedEditorState })
                })
              }

              setValue(serializedEditorState)
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
    <div className="errorBoundary" role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  )
}

export default withCondition(RichText)
