import React from 'react'

import type { Props } from './types'

import { isNumber } from 'payload/utilities'
import ReactSelect from '../../../elements/ReactSelect'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import useField from '../../useField'
import { fieldBaseClass } from '../shared'
import './index.scss'
import { NumberInput } from './Input'

const NumberField: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label, afterInput, beforeInput } = {},
      condition,
      description,
      placeholder,
      readOnly,
      step,
      style,
      width,
    } = {},
    hasMany,
    label,
    max,
    maxRows,
    min,
    minRows,
    path: pathFromProps,
    required,
    validate,
  } = props

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  const path = pathFromProps || name

  const memoizedValidate = React.useCallback(
    (value, options) => {
      return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const { errorMessage, setValue, showError, value } = useField<number | number[]>({
    path,
    validate: memoizedValidate,
  })

  return (
    <div
      className={[
        fieldBaseClass,
        'number',
        className,
        showError && 'error',
        readOnly && 'read-only',
        hasMany && 'has-many',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <ErrorComp message={errorMessage} showError={showError} />
      <LabelComp htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
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
          showError={showError}
          // value={valueToRender as Option[]}
        />
      ) : (
        <div className="input-wrapper">
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
      <FieldDescription description={description} value={value} />
    </div>
  )
}

export default NumberField
