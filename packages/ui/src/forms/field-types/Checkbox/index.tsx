import React from 'react'

import type { Props } from './types'

import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import { fieldBaseClass } from '../shared'
import { CheckboxInput } from './Input'
import DefaultLabel from '../../Label'
import './index.scss'

const baseClass = 'checkbox'

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
    onChange,
    path: pathFromProps,
    required,
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
        // showError && 'error',
        className,
        // value && `${baseClass}--checked`,
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
        <ErrorComp
          alignCaret="left"
          // message={errorMessage}
          //  showError={showError}
        />
      </div>
      <div
        className={[
          baseClass,
          className,
          // (checked || partialChecked) && `${baseClass}--checked`,
          readOnly && `${baseClass}--read-only`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={`${baseClass}__input`}>
          {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
          <CheckboxInput
            id={fieldID}
            label={typeof label === 'string' ? label : undefined}
            // label={getTranslation(label || name, i18n)}
            name={path}
            readOnly={readOnly}
            required={required}
            path={path}
          />
          {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
          {/* <span className={`${baseClass}__icon ${!partialChecked ? 'check' : 'partial'}`}>
            {!partialChecked && <Check />}
            {partialChecked && <Line />}
          </span> */}
        </div>
        {label && <LabelComp htmlFor={fieldID} label={label} required={required} />}
      </div>
      <FieldDescription
        description={description}
        path={path}
        // value={value}
      />
    </div>
  )
}

export default Checkbox
