import React from 'react'

import type { Props } from './types'

import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import { fieldBaseClass } from '../shared'
import { CheckboxInput } from './Input'
import DefaultLabel from '../../Label'
import './index.scss'
import { CheckboxWrapper } from './Wrapper'

const baseClass = 'checkbox'
const inputBaseClass = 'checkbox-input'

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
    valid,
    errorMessage,
    value,
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
        <ErrorComp alignCaret="left" message={errorMessage} showError={!valid} />
      </div>
      <CheckboxWrapper path={path} readOnly={readOnly} baseClass={inputBaseClass}>
        <div className={`${inputBaseClass}__input`}>
          {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
          <CheckboxInput
            id={fieldID}
            label={typeof label === 'string' ? label : undefined}
            // label={getTranslation(label || name, i18n)}
            name={path}
            readOnly={readOnly}
            required={required}
            path={path}
            iconClassName={`${inputBaseClass}__icon`}
          />
          {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
        </div>
        {label && <LabelComp htmlFor={fieldID} label={label} required={required} />}
      </CheckboxWrapper>
      <FieldDescription description={description} path={path} value={value} />
    </div>
  )
}

export default Checkbox
