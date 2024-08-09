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
    descriptionProps,
    errorProps,
    field,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        className,
        description,
        editorOptions = {},
        language = 'javascript',
        readOnly: readOnlyFromProps,
        style,
        width,
      },
      label,
      required,
    },
    labelProps,
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
      <FieldLabel
        Label={field?.admin?.components?.Label}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError
          CustomError={field?.admin?.components?.Error}
          path={path}
          {...(errorProps || {})}
        />
        <RenderComponent mappedComponent={field?.admin?.components?.beforeInput} />
        <CodeEditor
          defaultLanguage={prismToMonacoLanguageMap[language] || language}
          onChange={disabled ? () => null : (val) => setValue(val)}
          options={editorOptions}
          readOnly={disabled}
          value={(value as string) || ''}
        />
        <RenderComponent mappedComponent={field?.admin?.components?.afterInput} />
      </div>
      <FieldDescription
        Description={field?.admin?.components?.Description}
        description={description}
        {...(descriptionProps || {})}
      />
    </div>
  )
}

export const CodeField = withCondition(CodeFieldComponent)
