'use client'
import type { SerializedEditorState } from 'lexical'

import {
  FieldDescription,
  FieldError,
  FieldLabel,
  useField,
  useFieldProps,
  withCondition,
} from '@payloadcms/ui'
import React, { useCallback } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import type { SanitizedClientEditorConfig } from '../lexical/config/types.js'
import type { LexicalRichTextFieldProps } from '../types.js'

import { LexicalProvider } from '../lexical/LexicalProvider.js'
import './bundled.css'
import './index.scss'
import '../lexical/theme/EditorTheme.scss'

const baseClass = 'rich-text-lexical'

const RichTextComponent: React.FC<
  {
    readonly editorConfig: SanitizedClientEditorConfig // With rendered features n stuff
  } & LexicalRichTextFieldProps
> = (props) => {
  const {
    descriptionProps,
    editorConfig,
    errorProps,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        className,
        components: { Description, Error, Label },
        readOnly: readOnlyFromProps,
        style,
        width,
      },
      label,
      required,
    },
    field,
    labelProps,
    validate, // Users can pass in client side validation if they WANT to, but it's not required anymore
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
  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const fieldType = useField<SerializedEditorState>({
    path: pathFromContext ?? pathFromProps ?? name,
    validate: memoizedValidate,
  })

  const { formInitializing, formProcessing, initialValue, path, setValue, showError, value } =
    fieldType

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  const classes = [
    baseClass,
    'field-type',
    className,
    showError && 'error',
    disabled && `${baseClass}--read-only`,
    editorConfig?.admin?.hideGutter !== true ? `${baseClass}--show-gutter` : null,
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
      <FieldError CustomError={Error} path={path} {...(errorProps || {})} alignCaret="left" />
      <FieldLabel Label={Label} label={label} required={required} {...(labelProps || {})} />
      <div className={`${baseClass}__wrap`}>
        <ErrorBoundary fallbackRender={fallbackRender} onReset={() => {}}>
          <LexicalProvider
            editorConfig={editorConfig}
            field={field}
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
            readOnly={disabled}
            value={value}
          />
        </ErrorBoundary>
        <FieldDescription Description={Description} {...(descriptionProps || {})} />
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

export const RichText: typeof RichTextComponent = withCondition(RichTextComponent)
