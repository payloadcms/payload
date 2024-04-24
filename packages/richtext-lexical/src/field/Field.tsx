'use client'
import type { FormFieldBase } from '@payloadcms/ui/fields/shared'
import type { SerializedEditorState } from 'lexical'
import type { FieldBase } from 'payload/types'

import { FieldDescription } from '@payloadcms/ui/forms/FieldDescription'
import { FieldError } from '@payloadcms/ui/forms/FieldError'
import { FieldLabel } from '@payloadcms/ui/forms/FieldLabel'
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import { useField } from '@payloadcms/ui/forms/useField'
import { withCondition } from '@payloadcms/ui/forms/withCondition'
import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import type { SanitizedClientEditorConfig } from './lexical/config/types.js'

import './index.scss'
import { LexicalProvider } from './lexical/LexicalProvider.js'

const baseClass = 'rich-text-lexical'

const _RichText: React.FC<
  FormFieldBase & {
    editorConfig: SanitizedClientEditorConfig // With rendered features n stuff
    label?: FieldBase['label']
    name: string
    richTextComponentMap: Map<string, React.ReactNode>
    width?: string
  }
> = (props) => {
  const {
    name,
    CustomDescription,
    CustomError,
    CustomLabel,
    className,
    descriptionProps,
    editorConfig,
    errorProps,
    label,
    labelProps,
    path: pathFromProps,
    readOnly,
    required,
    style,
    validate, // Users can pass in client side validation if they WANT to, but it's not required anymore
    width,
  } = props

  const { path: pathFromContext } = useFieldProps()

  const fieldType = useField<SerializedEditorState>({
    path: pathFromContext || pathFromProps || name,
    validate,
  })

  const { initialValue, path, setValue, showError, value } = fieldType

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
        <FieldError CustomError={CustomError} path={path} {...(errorProps || {})} />
        <FieldLabel
          CustomLabel={CustomLabel}
          label={label}
          required={required}
          {...(labelProps || {})}
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
        {CustomDescription !== undefined ? (
          CustomDescription
        ) : (
          <FieldDescription {...(descriptionProps || {})} />
        )}
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

export const RichText = withCondition(_RichText)
