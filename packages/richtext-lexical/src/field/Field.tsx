'use client'
import type { EditorState, SerializedEditorState } from 'lexical'
import type { Validate } from 'payload'

import {
  FieldDescription,
  FieldError,
  FieldLabel,
  RenderCustomComponent,
  useEditDepth,
  useEffectEvent,
  useField,
} from '@payloadcms/ui'
import { mergeFieldStyles } from '@payloadcms/ui/shared'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import type { SanitizedClientEditorConfig } from '../lexical/config/types.js'

import '../lexical/theme/EditorTheme.scss'
import './bundled.css'
import './index.scss'

import type { LexicalRichTextFieldProps } from '../types.js'

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
    disabled: disabledFromField,
    initialValue,
    setValue,
    showError,
    value,
  } = useField<SerializedEditorState>({
    path,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || disabledFromField

  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState<boolean>(false)
  const [rerenderProviderKey, setRerenderProviderKey] = useState<Date>()

  const prevInitialValueRef = React.useRef<SerializedEditorState | undefined>(initialValue)
  const prevValueRef = React.useRef<SerializedEditorState | undefined>(value)

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

  const updateFieldValue = (editorState: EditorState) => {
    const newState = editorState.toJSON()
    prevValueRef.current = newState
    setValue(newState)
  }

  const handleChange = useCallback(
    (editorState: EditorState) => {
      if (typeof window.requestIdleCallback === 'function') {
        requestIdleCallback(() => updateFieldValue(editorState))
      } else {
        updateFieldValue(editorState)
      }
    },
    [setValue],
  )

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  const handleInitialValueChange = useEffectEvent(
    (initialValue: SerializedEditorState | undefined) => {
      // Object deep equality check here, as re-mounting the editor if
      // the new value is the same as the old one is not necessary
      if (
        prevValueRef.current !== value &&
        JSON.stringify(prevValueRef.current) !== JSON.stringify(value)
      ) {
        prevInitialValueRef.current = initialValue
        prevValueRef.current = value
        setRerenderProviderKey(new Date())
      }
    },
  )

  useEffect(() => {
    // Needs to trigger for object reference changes - otherwise,
    // reacting to the same initial value change twice will cause
    // the second change to be ignored, even though the value has changed.
    // That's because initialValue is not kept up-to-date
    if (!Object.is(initialValue, prevInitialValueRef.current)) {
      handleInitialValueChange(initialValue)
    }
  }, [initialValue])

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
            key={JSON.stringify({ path, rerenderProviderKey })} // makes sure lexical is completely re-rendered when initialValue changes, bypassing the lexical-internal value memoization. That way, external changes to the form will update the editor. More infos in PR description (https://github.com/payloadcms/payload/pull/5010)
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
