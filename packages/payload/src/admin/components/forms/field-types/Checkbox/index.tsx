import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { checkbox } from '../../../../../fields/validations'
import { getTranslation } from '../../../../../utilities/getTranslation'
import { useEditDepth } from '../../../utilities/EditDepth'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import useField from '../../useField'
import withCondition from '../../withCondition'
import { fieldBaseClass } from '../shared'
import { CheckboxInput } from './Input'
import './index.scss'

const baseClass = 'checkbox'

const Checkbox: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label, afterInput, beforeInput } = {},
      condition,
      description,
      readOnly,
      style,
      width,
    } = {},
    disableFormData,
    label,
    onChange,
    path: pathFromProps,
    required,
    validate = checkbox,
  } = props

  const ErrorComp = Error || DefaultError

  const { i18n } = useTranslation()

  const path = pathFromProps || name

  const editDepth = useEditDepth()

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

  const fieldID = `field-${path.replace(/\./g, '__')}${editDepth > 1 ? `-${editDepth}` : ''}`

  return (
    <div
      className={[
        fieldBaseClass,
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
        <ErrorComp alignCaret="left" message={errorMessage} showError={showError} />
      </div>
      <CheckboxInput
        Label={Label}
        afterInput={afterInput}
        beforeInput={beforeInput}
        checked={Boolean(value)}
        id={fieldID}
        label={getTranslation(label || name, i18n)}
        name={path}
        onToggle={onToggle}
        readOnly={readOnly}
        required={required}
      />
      <FieldDescription description={description} path={path} value={value} />
    </div>
  )
}

export default withCondition(Checkbox)
