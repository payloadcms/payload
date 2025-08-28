'use client'
import type { CodeFieldClientComponent } from 'payload'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { CodeEditor } from '../../elements/CodeEditor/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import './index.scss'
import { fieldBaseClass } from '../shared/index.js'

const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
}

const baseClass = 'code-field'

const CodeFieldComponent: CodeFieldClientComponent = (props) => {
  const {
    field,
    field: {
      admin: { className, description, editorOptions = {}, language = 'javascript' } = {},
      label,
      localized,
      required,
    },
    onMount,
    path: pathFromProps,
    readOnly,
    validate,
  } = props

  const inputChangeFromRef = React.useRef<'system' | 'user'>('system')
  const [editorKey, setEditorKey] = useState<string>('')

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

  const [initialStringValue, setInitialStringValue] = useState<string | undefined>(() =>
    (value || initialValue) !== undefined ? (value ?? initialValue) : undefined,
  )

  const handleChange = useCallback(
    (val) => {
      if (readOnly || disabled) {
        return
      }
      inputChangeFromRef.current = 'user'

      try {
        setValue(val ? val : null)
      } catch (e) {
        setValue(val ? val : null)
      }
    },
    [readOnly, disabled, setValue],
  )

  useEffect(() => {
    if (inputChangeFromRef.current === 'system') {
      setInitialStringValue(
        (value || initialValue) !== undefined ? (value ?? initialValue) : undefined,
      )
      setEditorKey(`${path}-${new Date().toString()}`)
    }

    inputChangeFromRef.current = 'system'
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
          <FieldLabel label={label} localized={localized} path={path} required={required} />
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
          key={editorKey}
          onChange={handleChange}
          onMount={onMount}
          options={editorOptions}
          readOnly={readOnly || disabled}
          value={initialStringValue}
          wrapperProps={{
            id: `field-${path?.replace(/\./g, '__')}`,
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
