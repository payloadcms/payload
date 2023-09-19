import React, { useCallback } from 'react'

import type { Props } from './types'

import { code } from '../../../../../fields/validations'
import { CodeEditor } from '../../../elements/CodeEditor'
import Error from '../../Error'
import FieldDescription from '../../FieldDescription'
import Label from '../../Label'
import useField from '../../useField'
import withCondition from '../../withCondition'
import './index.scss'

const prismToMonacoLanguageMap = {
  js: 'javascript',
  ts: 'typescript',
}

const baseClass = 'code-field'

const Code: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      condition,
      description,
      editorOptions,
      language,
      readOnly,
      style,
      width,
    } = {},
    label,
    path: pathFromProps,
    required,
    validate = code,
  } = props

  const path = pathFromProps || name

  const memoizedValidate = useCallback(
    (value, options) => {
      return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const { errorMessage, setValue, showError, value } = useField({
    condition,
    path,
    validate: memoizedValidate,
  })

  const classes = [
    baseClass,
    'field-type',
    className,
    showError && 'error',
    readOnly && 'read-only',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <Error message={errorMessage} showError={showError} />
      <Label htmlFor={`field-${path}`} label={label} required={required} />
      <CodeEditor
        defaultLanguage={prismToMonacoLanguageMap[language] || language}
        onChange={readOnly ? () => null : (val) => setValue(val)}
        options={editorOptions}
        readOnly={readOnly}
        value={(value as string) || ''}
      />
      <FieldDescription description={description} value={value} />
    </div>
  )
}

export default withCondition(Code)
