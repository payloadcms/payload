'use client'
import type { EditorState, SerializedEditorState } from 'lexical'
import type { Validate } from 'payload'

import {
  FieldDescription,
  FieldError,
  FieldLabel,
  RenderCustomComponent,
  useEditDepth,
  useField,
} from '@payloadcms/ui'
import { mergeFieldStyles } from '@payloadcms/ui/shared'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import type { SanitizedClientEditorConfig } from '../lexical/config/types.js'
import type { LexicalRichTextFieldProps } from '../types.js'

import '../lexical/theme/EditorTheme.scss'
import './bundled.css'
import './index.scss'
import { LexicalProvider } from '../lexical/LexicalProvider.js'

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
      admin: { className, description, readOnly: readOnlyFromAdmin } = {},
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

  const memoizedValidate = useCallback<Validate>(
    (value, validationOptions) => {
      if (typeof validate === 'function') {
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        return validate(value, { ...validationOptions, required })
      }
      return true
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
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || formProcessing || formInitializing

  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState<boolean>(false)

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport = window.matchMedia('(max-width: 768px)').matches

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport)
      }
    }
    updateViewPortWidth()
    window.addEventListener('resize', updateViewPortWidth)

    return () => {
      window.removeEventListener('resize', updateViewPortWidth)
    }
  }, [isSmallWidthViewport])

  const classes = [
    baseClass,
    'field-type',
    className,
    showError && 'error',
    disabled && `${baseClass}--read-only`,
    editorConfig?.admin?.hideGutter !== true && !isSmallWidthViewport
      ? `${baseClass}--show-gutter`
      : null,
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
      <RenderCustomComponent
        CustomComponent={Error}
        Fallback={<FieldError path={path} showError={showError} />}
      />
      {Label || <FieldLabel label={label} localized={localized} path={path} required={required} />}
      <div className={`${baseClass}__wrap`}>
        <ErrorBoundary fallbackRender={fallbackRender} onReset={() => {}}>
          {BeforeInput}
          <LexicalProvider
            composerKey={pathWithEditDepth}
            editorConfig={editorConfig}
            fieldProps={props}
            isSmallWidthViewport={isSmallWidthViewport}
            key={JSON.stringify({ initialValue, path })} // makes sure lexical is completely re-rendered when initialValue changes, bypassing the lexical-internal value memoization. That way, external changes to the form will update the editor. More infos in PR description (https://github.com/payloadcms/payload/pull/5010)
            onChange={handleChange}
            readOnly={disabled}
            value={value}
          />
          {AfterInput}
        </ErrorBoundary>
        {Description}
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </div>
    </div>
  )
}

function fallbackRender({ error }: { error: Error }) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return (
    <div className="errorBoundary" role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  )
}

export const RichText: typeof RichTextComponent = RichTextComponent
