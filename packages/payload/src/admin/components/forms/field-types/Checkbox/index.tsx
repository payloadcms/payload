import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { checkbox } from '../../../../../fields/validations'
import { getTranslation } from '../../../../../utilities/getTranslation'
import Error from '../../Error'
import FieldDescription from '../../FieldDescription'
import useField from '../../useField'
import withCondition from '../../withCondition'
import { CheckboxInput } from './Input'
import './index.scss'

const baseClass = 'checkbox'

const Checkbox: React.FC<Props> = (props) => {
  const {
    admin: { className, condition, description, readOnly, style, width } = {},
    disableFormData,
    label,
    name,
    onChange,
    path: pathFromProps,
    required,
    validate = checkbox,
  } = props

  const { i18n } = useTranslation()

  const path = pathFromProps || name

  const memoizedValidate = useCallback(
    (value, options) => {
      return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const { errorMessage, setValue, showError, value } = useField({
    condition,
    disableFormData,
    path,
    validate: memoizedValidate,
  })

  const onToggle = useCallback(() => {
    if (!readOnly) {
      setValue(!value)
      if (typeof onChange === 'function') onChange(!value)
    }
  }, [onChange, readOnly, setValue, value])

  const fieldID = `field-${path.replace(/\./g, '__')}`

  return (
    <div
      className={[
        'field-type',
        baseClass,
        showError && 'error',
        className,
        value && `${baseClass}--checked`,
        readOnly && `${baseClass}--read-only`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__error-wrap`}>
        <Error message={errorMessage} showError={showError} />
      </div>
      <CheckboxInput
        checked={Boolean(value)}
        id={fieldID}
        label={getTranslation(label || name, i18n)}
        name={path}
        onToggle={onToggle}
        readOnly={readOnly}
      />
      <FieldDescription description={description} value={value} />
    </div>
  )
}

export default withCondition(Checkbox)
