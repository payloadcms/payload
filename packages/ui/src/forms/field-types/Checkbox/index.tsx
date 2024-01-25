import React, { useCallback } from 'react'

import type { Props } from './types'
import { fieldBaseClass } from '../shared'
import { withCondition } from '../../withCondition'
import { Validate } from 'payload/types'
import useField from '../../useField'
import { Check } from '../../../icons/Check'
import { Line } from '../../../icons/Line'
import { useTranslation } from '../../../providers/Translation'

import './index.scss'

const baseClass = 'checkbox'

export const inputBaseClass = 'checkbox-input'

const Checkbox: React.FC<Props> = (props) => {
  const {
    className,
    readOnly,
    style,
    width,
    required,
    validate,
    BeforeInput,
    AfterInput,
    Label,
    Error,
    Description,
    onChange: onChangeFromProps,
    partialChecked,
    checked: checkedFromProps,
    disableFormData,
    id,
  } = props

  const { i18n } = useTranslation()

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const { setValue, value, showError, path } = useField({
    disableFormData,
    validate: memoizedValidate,
  })

  const onToggle = useCallback(() => {
    if (!readOnly) {
      setValue(!value)
      if (typeof onChangeFromProps === 'function') onChangeFromProps(!value)
    }
  }, [onChangeFromProps, readOnly, setValue, value])

  const checked = checkedFromProps || Boolean(value)

  const fieldID = id || `field-${path?.replace(/\./g, '__')}`

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
      <div className={`${baseClass}__error-wrap`}>{Error}</div>
      <div>
        <div className={`${inputBaseClass}__input`}>
          {BeforeInput}
          <input
            className={className}
            aria-label=""
            defaultChecked={Boolean(checked)}
            disabled={readOnly}
            id={fieldID}
            name={path}
            onInput={onToggle}
            // ref={inputRef}
            type="checkbox"
            required={required}
          />
          <span
            className={[`${inputBaseClass}__icon`, !value && partialChecked ? 'check' : 'partial']
              .filter(Boolean)
              .join(' ')}
          >
            {value && <Check />}
            {!value && partialChecked && <Line />}
          </span>
          {AfterInput}
        </div>
        {Label}
      </div>
      {Description}
    </div>
  )
}

export default withCondition(Checkbox)
