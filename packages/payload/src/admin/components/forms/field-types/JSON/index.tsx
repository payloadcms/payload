import React, { useCallback, useEffect, useState } from 'react'

import type { Props } from './types'

import { json } from '../../../../../fields/validations'
import { CodeEditor } from '../../../elements/CodeEditor'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import useField from '../../useField'
import withCondition from '../../withCondition'
import './index.scss'
import { fieldBaseClass } from '../shared'

const baseClass = 'json-field'

const JSONField: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      condition,
      description,
      editorOptions,
      readOnly,
      style,
      width,
      components: { Error, Label } = {},
    } = {},
    label,
    path: pathFromProps,
    required,
    validate = json,
  } = props

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  const path = pathFromProps || name
  const [stringValue, setStringValue] = useState<string>()
  const [jsonError, setJsonError] = useState<string>()

  const memoizedValidate = useCallback(
    (value, options) => {
      return validate(value, { ...options, jsonError, required })
    },
    [validate, required, jsonError],
  )

  const { errorMessage, initialValue, setValue, showError, value } = useField<string>({
    condition,
    path,
    validate: memoizedValidate,
  })

  const handleChange = useCallback(
    (val) => {
      if (readOnly) return
      setStringValue(val)

      try {
        setValue(JSON.parse(val.trim() || '{}'))
        setJsonError(undefined)
      } catch (e) {
        setJsonError(e)
      }
    },
    [readOnly, setValue, setStringValue],
  )

  useEffect(() => {
    setStringValue(JSON.stringify(initialValue, null, 2))
  }, [initialValue])

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        readOnly && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <ErrorComp message={errorMessage} showError={showError} />
      <LabelComp htmlFor={`field-${path}`} label={label} required={required} />
      <CodeEditor
        defaultLanguage="json"
        onChange={handleChange}
        options={editorOptions}
        readOnly={readOnly}
        value={stringValue}
      />
      <FieldDescription description={description} value={value} />
    </div>
  )
}

export default withCondition(JSONField)
