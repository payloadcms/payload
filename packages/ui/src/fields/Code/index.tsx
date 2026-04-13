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
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
}

const baseClass = 'code-field'

const CodeFieldComponent: CodeFieldClientComponent = (props) => {
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
          onChange={handleChange}
          onMount={onMount}
          options={editorOptions}
          readOnly={readOnly || disabled}
          recalculatedHeightAt={recalculatedHeightAt}
          value={stringValueRef.current}
          wrapperProps={{
            id: `field-${path?.replace(/\./g, '__')}`,
          }}
          {...(editorProps || {})}
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
