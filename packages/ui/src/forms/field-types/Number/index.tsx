import React from 'react'

import type { Props } from './types'
import { isNumber } from 'payload/utilities'
import ReactSelect from '../../../elements/ReactSelect'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import { NumberInput } from './Input'
import { NumberInputWrapper } from './Wrapper'

import './index.scss'

const NumberField: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label, afterInput, beforeInput } = {},
      description,
      placeholder,
      readOnly,
      step,
      style,
      width,
    } = {},
    hasMany,
    label,
    maxRows,
    min,
    path: pathFromProps,
    required,
    valid = true,
    i18n,
    value,
  } = props

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  const path = pathFromProps || name

  return (
    <NumberInputWrapper
      className={className}
      readOnly={readOnly}
      hasMany={hasMany}
      style={style}
      width={width}
      path={path}
    >
      <ErrorComp path={path} />
      <LabelComp
        htmlFor={`field-${path.replace(/\./g, '__')}`}
        label={label}
        required={required}
        i18n={i18n}
      />
      {hasMany ? (
        <ReactSelect
          className={`field-${path.replace(/\./g, '__')}`}
          disabled={readOnly}
          filterOption={(option, rawInput) => {
            // eslint-disable-next-line no-restricted-globals
            const isOverHasMany = Array.isArray(value) && value.length >= maxRows
            return isNumber(rawInput) && !isOverHasMany
          }}
          isClearable
          isCreatable
          isMulti
          isSortable
          // noOptionsMessage={({ inputValue }) => {
          //   const isOverHasMany = Array.isArray(value) && value.length >= maxRows
          //   if (isOverHasMany) {
          //     return t('validation:limitReached', { max: maxRows, value: value.length + 1 })
          //   }
          //   return t('general:noOptions')
          // }}
          // numberOnly
          // onChange={handleHasManyChange}
          options={[]}
          // placeholder={t('general:enterAValue')}
          showError={!valid}
          // value={valueToRender as Option[]}
        />
      ) : (
        <div>
          {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
          <NumberInput
            path={path}
            required={required}
            min={min}
            placeholder={placeholder}
            readOnly={readOnly}
            step={step}
            hasMany={hasMany}
            name={name}
          />
          {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
        </div>
      )}
      <FieldDescription description={description} value={value} i18n={i18n} />
    </NumberInputWrapper>
  )
}

export default NumberField
