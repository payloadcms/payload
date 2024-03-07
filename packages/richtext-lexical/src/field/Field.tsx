'use client'
import type { SerializedEditorState } from 'lexical'

import { type FormFieldBase, useField } from '@payloadcms/ui'
import React, { useCallback } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import type { SanitizedClientEditorConfig } from './lexical/config/types.js'

import './index.scss'
import { LexicalProvider } from './lexical/LexicalProvider.js'

const baseClass = 'rich-text-lexical'

export const RichText: React.FC<
  FormFieldBase & {
    editorConfig: SanitizedClientEditorConfig // With rendered features n stuff
    name: string
    richTextComponentMap: Map<string, React.ReactNode>
  }
> = (props) => {
  const {
    name,
    Description,
    Error,
    Label,
    className,
    editorConfig,
    path: pathFromProps,
    readOnly,
    required,
    style,
    validate, // Users can pass in client side validation if they WANT to, but it's not required anymore
    width,
  } = props

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function') {
        return validate(value, { ...validationOptions, props, required })
      }
    },
    // Important: do not add props to the dependencies array.
    // This would cause an infinite loop and endless re-rendering.
    // Removing props from the dependencies array fixed this issue: https://github.com/payloadcms/payload/issues/3709
    [validate, required],
  )

  const fieldType = useField<SerializedEditorState>({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const { errorMessage, initialValue, path, schemaPath, setValue, showError, value } = fieldType

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
      key={path}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__wrap`}>
        {Error}
        {Label}
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
        {Description}
      </div>
    </div>
  )
}

function fallbackRender({ error }): React.ReactElement {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return (
    <div className="errorBoundary" role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  )
}
