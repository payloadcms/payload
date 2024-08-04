'use client'
import type { CodeFieldProps } from 'payload'

import React, { useCallback } from 'react'

import { CodeEditor } from '../../elements/CodeEditor/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
}

const baseClass = 'code-field'

const CodeFieldComponent: React.FC<CodeFieldProps> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Description, Error, Label, afterInput, beforeInput },
      description,
      style,
      width,
    },
    descriptionProps,
    editorOptions = {},
    errorProps,
    label,
    labelProps,
    language = 'javascript',
    path: pathFromProps,
    readOnly: readOnlyFromProps,
    required,
    validate,
  } = props

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { formInitializing, formProcessing, path, setValue, showError, value } = useField({
    path: pathFromContext ?? pathFromProps ?? name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        disabled && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <FieldLabel CustomLabel={Label} label={label} required={required} {...(labelProps || {})} />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError CustomError={Error} path={path} {...(errorProps || {})} />
        <RenderComponent mappedComponent={beforeInput} />
        <CodeEditor
          defaultLanguage={prismToMonacoLanguageMap[language] || language}
          onChange={disabled ? () => null : (val) => setValue(val)}
          options={editorOptions}
          readOnly={disabled}
          value={(value as string) || ''}
        />
        <RenderComponent mappedComponent={afterInput} />
      </div>
      <FieldDescription
        CustomDescription={Description}
        description={description}
        {...(descriptionProps || {})}
      />
    </div>
  )
}

export const CodeField = withCondition(CodeFieldComponent)
