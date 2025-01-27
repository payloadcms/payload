'use client'
import type { SerializedEditorState } from 'lexical'

import {
  Error as DefaultError,
  Label as DefaultLabel,
  FieldDescription,
  useField,
  withCondition,
} from 'payload/components/forms'
import React, { useCallback } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import type { FieldProps } from '../types'

import { richTextValidateHOC } from '../validate'
import './index.scss'
import { LexicalProvider } from './lexical/LexicalProvider'

const baseClass = 'rich-text-lexical'

const RichText: React.FC<FieldProps> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label } = {},
      condition,
      description,
      readOnly,
      style,
      width,
    } = {
      className,
      components: {},
      condition,
      description,
      readOnly,
      style,
      width,
    },
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
    // Important: do not add props to the dependencies array.
    // This would cause an infinite loop and endless re-rendering.
    // Removing props from the dependencies array fixed this issue: https://github.com/payloadcms/payload/issues/3709
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

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  return (
    <div
      className={classes}
      key={path}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__wrap`}>
        <ErrorComp message={errorMessage} showError={showError} />
        <LabelComp
          htmlFor={`field-${path.replace(/\./g, '__')}`}
          label={label}
          required={required}
        />
        <ErrorBoundary fallbackRender={fallbackRender} onReset={() => {}}>
          <LexicalProvider
            editorConfig={editorConfig}
            fieldProps={props}
            key={JSON.stringify({ initialValue, path })} // makes sure lexical is completely re-rendered when initialValue changes, bypassing the lexical-internal value memoization. That way, external changes to the form will update the editor. More infos in PR description (https://github.com/payloadcms/payload/pull/5010)
            onChange={(editorState) => {
              let serializedEditorState = editorState.toJSON()

              // Transform state through save hooks
              if (editorConfig?.features?.hooks?.save?.length) {
                editorConfig.features.hooks.save.forEach((hook) => {
                  serializedEditorState = hook({ incomingEditorState: serializedEditorState })
                })
              }

              setValue(serializedEditorState)
            }}
            path={path}
            readOnly={readOnly}
            value={value}
          />
        </ErrorBoundary>
        <FieldDescription description={description} path={path} value={value} />
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
