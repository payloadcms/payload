'use client'
import type { CodeFieldClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { RenderCustomComponent } from '../../../shared/elements/RenderCustomComponent/index.js'
import { mergeFieldStyles } from '../../../shared/fields/mergeFieldStyles.js'
import { CodeEditor } from '../../elements/CodeEditor/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.css'

const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
}

const baseClass = 'code-field'

const CodeFieldComponent: React.FC<CodeFieldClientProps> = (props) => {
  const {
    field,
    field: {
      admin: { className, description, editorOptions, editorProps, language = 'javascript' } = {},
      label,
      localized,
      required,
    },
    onMount,
    path: pathFromProps,
    readOnly,
    validate,
  } = props

  const { i18n } = useTranslation()
  const codeEditorProps = editorProps as
    | Partial<React.ComponentProps<typeof CodeEditor>>
    | undefined
  const editorRef =
    React.useRef<Parameters<NonNullable<React.ComponentProps<typeof CodeEditor>['onMount']>>[0]>(
      null,
    )

  const inputChangeFromRef = React.useRef<'formState' | 'internalEditor'>('formState')
  const [recalculatedHeightAt, setRecalculatedHeightAt] = useState<number | undefined>(Date.now())

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    initialValue,
    path,
    setValue,
    showError,
    value,
  } = useField<string>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate,
  })

  const stringValueRef = React.useRef<string>(
    (value || initialValue) !== undefined ? (value ?? initialValue) : undefined,
  )

  const handleChange = useCallback(
    (val: string) => {
      if (readOnly || disabled) {
        return
      }
      inputChangeFromRef.current = 'internalEditor'

      try {
        setValue(val ? val : null)
        stringValueRef.current = val
      } catch (e) {
        setValue(val ? val : null)
        stringValueRef.current = val
      }
    },
    [readOnly, disabled, setValue],
  )

  useEffect(() => {
    if (inputChangeFromRef.current === 'formState') {
      stringValueRef.current =
        (value || initialValue) !== undefined ? (value ?? initialValue) : undefined
      setRecalculatedHeightAt(Date.now())
    }

    inputChangeFromRef.current = 'formState'
  }, [initialValue, path, value])

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        (readOnly || disabled) && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={styles}
    >
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={
          <FieldLabel
            as="span"
            hasRequiredAccessibleState
            label={label}
            localized={localized}
            onClick={() => editorRef.current?.focus()}
            path={path}
            required={required}
          />
        }
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <RenderCustomComponent
          CustomComponent={Error}
          Fallback={<FieldError path={path} showError={showError} />}
        />
        {BeforeInput}
        <CodeEditor
          defaultLanguage={prismToMonacoLanguageMap[language] || language}
          onChange={handleChange}
          readOnly={readOnly || disabled}
          recalculatedHeightAt={recalculatedHeightAt}
          value={stringValueRef.current}
          wrapperProps={{
            id: `field-${path?.replace(/\./g, '__')}`,
          }}
          {...(codeEditorProps || {})}
          onMount={(editor, monaco) => {
            editorRef.current = editor
            ;(codeEditorProps?.onMount ?? onMount)?.(editor, monaco)
          }}
          options={{
            ariaLabel: getTranslation(label || '', i18n) || undefined,
            ariaRequired: required,
            ...((codeEditorProps?.options ?? editorOptions) || {}),
          }}
        />
        {AfterInput}
      </div>
      <RenderCustomComponent
        CustomComponent={Description}
        Fallback={<FieldDescription description={description} path={path} />}
      />
    </div>
  )
}

export const CodeField = withCondition(CodeFieldComponent)
