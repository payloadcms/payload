import React, { useEffect, useState } from 'react'

import type { FieldCondition } from '../types'
import type { Props } from './types'

import useDebounce from '../../../../hooks/useDebounce'
import RenderCustomComponent from '../../../utilities/RenderCustomComponent'
import Button from '../../Button'
import ReactSelect from '../../ReactSelect'
import Date from './Date'
import Number from './Number'
import Relationship from './Relationship'
import { Select } from './Select'
import Text from './Text'
import './index.scss'

const valueFields = {
  Date,
  Number,
  Relationship,
  Select,
  Text,
}

const baseClass = 'condition'

const Condition: React.FC<Props> = (props) => {
  const { andIndex, dispatch, fields, orIndex, value } = props
  const fieldName = Object.keys(value)[0]
  const [activeField, setActiveField] = useState<FieldCondition>(() =>
    fields.find((field) => fieldName === field.value),
  )

  const operatorAndValue = value?.[fieldName] ? Object.entries(value[fieldName])[0] : undefined
  const queryValue = operatorAndValue?.[1]
  const operatorValue = operatorAndValue?.[0]

  const [internalValue, setInternalValue] = useState(queryValue)
  const [internalOperatorField, setInternalOperatorField] = useState(operatorValue)

  const debouncedValue = useDebounce(internalValue, 300)

  useEffect(() => {
    const newActiveField = fields.find(({ value: name }) => name === fieldName)

    if (newActiveField && newActiveField !== activeField) {
      setActiveField(newActiveField)
      setInternalOperatorField(null)
      setInternalValue('')
    }
  }, [fieldName, fields, activeField])

  useEffect(() => {
    dispatch({
      type: 'update',
      andIndex,
      orIndex,
      value: debouncedValue || '',
    })
  }, [debouncedValue, dispatch, orIndex, andIndex])

  const booleanSelect = ['exists'].includes(operatorValue) || activeField.props.type === 'checkbox'
  const ValueComponent = booleanSelect
    ? Select
    : valueFields[activeField?.component] || valueFields.Text

  let valueOptions
  if (booleanSelect) {
    valueOptions = ['true', 'false']
  } else if (activeField?.props && 'options' in activeField.props) {
    valueOptions = activeField.props.options
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__inputs`}>
          <div className={`${baseClass}__field`}>
            <ReactSelect
              isClearable={false}
              onChange={(field) => {
                dispatch({
                  type: 'update',
                  andIndex,
                  field: field?.value,
                  orIndex,
                })
              }}
              options={fields}
              value={fields.find((field) => fieldName === field.value)}
            />
          </div>
          <div className={`${baseClass}__operator`}>
            <ReactSelect
              disabled={!fieldName}
              isClearable={false}
              onChange={(operator) => {
                dispatch({
                  type: 'update',
                  andIndex,
                  operator: operator.value,
                  orIndex,
                })
                setInternalOperatorField(operator.value)
                setInternalValue('') // Reset value when operator changes
              }}
              options={activeField.operators}
              value={
                activeField.operators.find(
                  (operator) => internalOperatorField === operator.value,
                ) || null
              }
            />
          </div>
          <div className={`${baseClass}__value`}>
            <RenderCustomComponent
              CustomComponent={activeField?.props?.admin?.components?.Filter}
              DefaultComponent={ValueComponent}
              componentProps={{
                ...activeField?.props,
                disabled: !operatorValue,
                onChange: setInternalValue,
                operator: operatorValue,
                options: valueOptions,
                value: internalValue,
              }}
            />
          </div>
        </div>
        <div className={`${baseClass}__actions`}>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__actions-remove`}
            icon="x"
            iconStyle="with-border"
            onClick={() =>
              dispatch({
                type: 'remove',
                andIndex,
                orIndex,
              })
            }
            round
          />
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__actions-add`}
            icon="plus"
            iconStyle="with-border"
            onClick={() =>
              dispatch({
                type: 'add',
                andIndex: andIndex + 1,
                field: fields[0].value,
                orIndex,
                relation: 'and',
              })
            }
            round
          />
        </div>
      </div>
    </div>
  )
}

export default Condition
