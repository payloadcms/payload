'use client'
import type { EditorState, SerializedEditorState } from 'lexical'

import { FieldLabel, useEditDepth, useField, withCondition } from '@payloadcms/ui'
import { mergeFieldStyles } from '@payloadcms/ui/shared'
import React, { useCallback, useMemo } from 'react'
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
    editorConfig,
    field,
    field: {
      name,
      admin: { className, readOnly: readOnlyFromAdmin } = {},
      label,
      localized,
      required,
    },
    path: pathFromProps,
    readOnly: readOnlyFromTopLevelProps,
    validate, // Users can pass in client side validation if they WANT to, but it's not required anymore
  } = props

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin
  const path = pathFromProps ?? name

  const editDepth = useEditDepth()

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function') {
        return validate(value, { ...validationOptions, required })
      }
    },
    // Important: do not add props to the dependencies array.
    // This would cause an infinite loop and endless re-rendering.
    // Removing props from the dependencies array fixed this issue: https://github.com/payloadcms/payload/issues/3709
    [validate, required],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    formInitializing,
    formProcessing,
    initialValue,
    setValue,
    showError,
    value,
  } = useField<SerializedEditorState>({
    path,
    // @ts-expect-error: TODO: Fix this
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || formProcessing || formInitializing

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

  const pathWithEditDepth = `${path}.${editDepth}`

  const handleChange = useCallback(
    (editorState: EditorState) => {
      setValue(editorState.toJSON())
    },
    [setValue],
  )

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  return (
    <div className={classes} key={pathWithEditDepth} style={styles}>
      {Error}
      {Label || <FieldLabel label={label} localized={localized} required={required} />}
      <div className={`${baseClass}__wrap`}>
        <ErrorBoundary fallbackRender={fallbackRender} onReset={() => {}}>
          {BeforeInput}
          <LexicalProvider
            composerKey={pathWithEditDepth}
            editorConfig={editorConfig}
            fieldProps={props}
            key={JSON.stringify({ initialValue, path })} // makes sure lexical is completely re-rendered when initialValue changes, bypassing the lexical-internal value memoization. That way, external changes to the form will update the editor. More infos in PR description (https://github.com/payloadcms/payload/pull/5010)
            onChange={handleChange}
            readOnly={disabled}
            value={value}
          />
          {AfterInput}
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

export const RichText: typeof RichTextComponent = withCondition(RichTextComponent)
