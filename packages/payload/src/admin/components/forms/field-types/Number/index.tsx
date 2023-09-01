import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Option } from '../../../elements/ReactSelect/types'
import type { Props } from './types'

import { number } from '../../../../../fields/validations'
import { getTranslation } from '../../../../../utilities/getTranslation'
import { isNumber } from '../../../../../utilities/isNumber'
import ReactSelect from '../../../elements/ReactSelect'
import Error from '../../Error'
import FieldDescription from '../../FieldDescription'
import Label from '../../Label'
import useField from '../../useField'
import withCondition from '../../withCondition'
import './index.scss'

const NumberField: React.FC<Props> = (props) => {
  const {
    admin: { className, condition, description, placeholder, readOnly, step, style, width } = {},
    hasMany,
    label,
    max,
    maxRows,
    min,
    minRows,
    name,
    path: pathFromProps,
    required,
    validate = number,
  } = props

  const { i18n, t } = useTranslation()

  const path = pathFromProps || name

  const memoizedValidate = useCallback(
    (value, options) => {
      return validate(value, { ...options, max, min, required })
    },
    [validate, min, max, required],
  )

  const { errorMessage, setValue, showError, value } = useField<number | number[]>({
    condition,
    path,
    validate: memoizedValidate,
  })

  const handleChange = useCallback(
    (e) => {
      const val = parseFloat(e.target.value)

      if (Number.isNaN(val)) {
        setValue('')
      } else {
        setValue(val)
      }
    },
    [setValue],
  )

  const classes = [
    'field-type',
    'number',
    className,
    showError && 'error',
    readOnly && 'read-only',
    hasMany && 'has-many',
  ]
    .filter(Boolean)
    .join(' ')

  const [valueToRender, setValueToRender] = useState<
    { id: string; label: string; value: { value: number } }[]
  >([]) // Only for hasMany

  const handleHasManyChange = useCallback(
    (selectedOption) => {
      if (!readOnly) {
        let newValue
        if (!selectedOption) {
          newValue = []
        } else if (Array.isArray(selectedOption)) {
          newValue = selectedOption.map((option) => Number(option.value?.value || option.value))
        } else {
          newValue = [Number(selectedOption.value?.value || selectedOption.value)]
        }

        setValue(newValue)
      }
    },
    [readOnly, setValue],
  )

  // useeffect update valueToRender:
  useEffect(() => {
    if (hasMany && Array.isArray(value)) {
      setValueToRender(
        value.map((val, index) => {
          return {
            id: `${val}${index}`, // append index to avoid duplicate keys but allow duplicate numbers
            label: `${val}`,
            value: {
              toString: () => `${val}${index}`,
              value: (val as any)?.value || val,
            }, // You're probably wondering, why the hell is this done that way? Well, React-select automatically uses "label-value" as a key, so we will get that react duplicate key warning if we just pass in the value as multiple values can be the same. So we need to append the index to the toString() of the value to avoid that warning, as it uses that as the key.
          }
        }),
      )
    }
  }, [value, hasMany])

  return (
    <div
      style={{
        ...style,
        width,
      }}
      className={classes}
    >
      <Error message={errorMessage} showError={showError} />
      <Label htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
      {hasMany ? (
        <ReactSelect
          filterOption={(option, rawInput) => {
            // eslint-disable-next-line no-restricted-globals
            const isOverHasMany = Array.isArray(value) && value.length >= maxRows
            return isNumber(rawInput) && !isOverHasMany
          }}
          noOptionsMessage={({ inputValue }) => {
            const isOverHasMany = Array.isArray(value) && value.length >= maxRows
            if (isOverHasMany) {
              return t('validation:limitReached', { max: maxRows, value: value.length + 1 })
            }
            return t('general:noOptions')
          }}
          className={`field-${path.replace(/\./g, '__')}`}
          disabled={readOnly}
          isClearable
          isCreatable
          isMulti
          isSortable
          numberOnly
          onChange={handleHasManyChange}
          options={[]}
          placeholder={t('general:enterAValue')}
          showError={showError}
          value={valueToRender as Option[]}
        />
      ) : (
        <input
          onWheel={(e) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            e.target.blur()
          }}
          disabled={readOnly}
          id={`field-${path.replace(/\./g, '__')}`}
          name={path}
          onChange={handleChange}
          placeholder={getTranslation(placeholder, i18n)}
          step={step}
          type="number"
          value={typeof value === 'number' ? value : ''}
        />
      )}

      <FieldDescription description={description} value={value} />
    </div>
  )
}

export default withCondition(NumberField)
