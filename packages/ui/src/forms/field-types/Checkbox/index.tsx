import React from 'react'

import { getTranslation } from '@payloadcms/translations'

import type { Props } from './types'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import { fieldBaseClass } from '../shared'
import { CheckboxInput } from './Input'
import DefaultLabel from '../../Label'
import { CheckboxWrapper } from './Wrapper'

import './index.scss'

const baseClass = 'checkbox'

export const inputBaseClass = 'checkbox-input'

const Checkbox: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label, afterInput, beforeInput } = {},
      description,
      readOnly,
      style,
      width,
    } = {},
    disableFormData,
    label,
    path: pathFromProps,
    required,
    valid = true,
    errorMessage,
    value,
    i18n,
  } = props

  const path = pathFromProps || name

  const fieldID = `field-${path.replace(/\./g, '__')}`

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        !valid && 'error',
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
        <ErrorComp alignCaret="left" path={path} />
      </div>
      <CheckboxWrapper path={path} readOnly={readOnly} baseClass={inputBaseClass}>
        <div className={`${inputBaseClass}__input`}>
          {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
          <CheckboxInput
            id={fieldID}
            label={getTranslation(label || name, i18n)}
            name={path}
            readOnly={readOnly}
            required={required}
            path={path}
            iconClassName={`${inputBaseClass}__icon`}
          />
          {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
        </div>
        {label && <LabelComp htmlFor={fieldID} label={label} required={required} i18n={i18n} />}
      </CheckboxWrapper>
      <FieldDescription description={description} path={path} value={value} i18n={i18n} />
    </div>
  )
}

export default Checkbox
