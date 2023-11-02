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
  const fieldValue = Object.keys(value)[0]

  const operatorAndValueArray = value?.[fieldValue] ? Object.entries(value[fieldValue]) : []
  const operatorAndValue = operatorAndValueArray[operatorAndValueArray.length - 1]

  const operatorValue = operatorAndValue?.[0]
  const queryValue = operatorAndValue?.[1]

  const [selectedOperator, setSelectedOperator] = useState<string | undefined>(operatorValue)

  const [activeField, setActiveField] = useState<FieldCondition>(() =>
    fields.find((field) => fieldValue === field.value),
  )
  const [internalValue, setInternalValue] = useState(queryValue)
  const debouncedValue = useDebounce(internalValue, 300)

  // Update selectedOperator when operatorValue changes
  useEffect(() => {
    setSelectedOperator(operatorValue)
  }, [operatorValue])

  // Reset operator when field changes
  useEffect(() => {
    if (fieldValue !== activeField.value) {
      setSelectedOperator(undefined)
    }
  }, [fieldValue, activeField])

  useEffect(() => {
    const newActiveField = fields.find((field) => fieldValue === field.value)

    if (newActiveField && newActiveField !== activeField) {
      setActiveField(newActiveField)

      setInternalValue('')

      dispatch({
        andIndex,
        field: fieldValue,
        orIndex,
        type: 'update',
      })
    }
  }, [fieldValue, fields, dispatch, andIndex, orIndex, activeField])

  useEffect(() => {
    if (operatorValue) {
      dispatch({
        andIndex,
        operator: operatorValue,
        orIndex,
        type: 'update',
        value: debouncedValue || '',
      })
    }
  }, [debouncedValue, dispatch, orIndex, andIndex, operatorValue])

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
              onChange={(field) =>
                dispatch({
                  andIndex,
                  field: field?.value || undefined,
                  orIndex,
                  type: 'update',
                })
              }
              options={fields}
              value={fields.find((field) => fieldValue === field.value)}
            />
          </div>
          <div className={`${baseClass}__operator`}>
            <ReactSelect
              disabled={!fieldValue}
              isClearable={false}
              onChange={(operator) => {
                setSelectedOperator(operator.value)
                dispatch({
                  andIndex,
                  operator: operator.value,
                  orIndex,
                  type: 'update',
                })
              }}
              options={activeField.operators}
              value={
                selectedOperator != null
                  ? activeField.operators.find((o) => selectedOperator === o.value) || null
                  : null
              }
            />
          </div>
          <div className={`${baseClass}__value`}>
            <RenderCustomComponent
              CustomComponent={activeField?.props?.admin?.components?.Filter}
              DefaultComponent={ValueComponent}
              componentProps={{
                ...activeField?.props,
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
                andIndex,
                orIndex,
                type: 'remove',
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
                andIndex: andIndex + 1,
                field: fields[0].value,
                orIndex,
                relation: 'and',
                type: 'add',
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
