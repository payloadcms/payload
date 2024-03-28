import React, { useEffect, useState } from 'react'

import type { FieldCondition } from '../types.js'

export type Props = {
  addCondition: ({
    andIndex,
    fieldName,
    orIndex,
    relation,
  }: {
    andIndex: number
    fieldName: string
    orIndex: number
    relation: 'and' | 'or'
  }) => void
  andIndex: number
  fieldName: string
  fields: FieldCondition[]
  initialValue: string
  operator: string
  orIndex: number
  removeCondition: ({ andIndex, orIndex }: { andIndex: number; orIndex: number }) => void
  updateCondition: ({
    andIndex,
    fieldName,
    operator,
    orIndex,
    value,
  }: {
    andIndex: number
    fieldName: string
    operator: string
    orIndex: number
    value: string
  }) => void
}

import type { RelationshipFieldProps } from '@payloadcms/ui/fields/Relationship'

import { RenderCustomComponent } from '../../../elements/RenderCustomComponent/index.js'
import { useDebounce } from '../../../hooks/useDebounce.js'
import { Button } from '../../Button/index.js'
import { ReactSelect } from '../../ReactSelect/index.js'
import { DateField } from './Date/index.js'
import { NumberField } from './Number/index.js'
import { RelationshipField } from './Relationship/index.js'
import { Select } from './Select/index.js'
import Text from './Text/index.js'
import './index.scss'

type ComponentType = 'Date' | 'Number' | 'Relationship' | 'Select' | 'Text'
const valueFields: Record<ComponentType, React.FC> = {
  Date: DateField,
  Number: NumberField,
  Relationship: RelationshipField,
  Select,
  Text,
}

const baseClass = 'condition'

export const Condition: React.FC<Props> = (props) => {
  const {
    addCondition,
    andIndex,
    fieldName,
    fields,
    initialValue,
    operator,
    orIndex,
    removeCondition,
    updateCondition,
  } = props
  const [activeField, setActiveField] = useState<FieldCondition>(() =>
    fields.find((field) => fieldName === field.value),
  )

  const [internalQueryValue, setInternalQueryValue] = useState<string>(initialValue)
  const [internalOperatorOption, setInternalOperatorOption] = useState(operator)

  const debouncedValue = useDebounce(internalQueryValue, 300)

  useEffect(() => {
    updateCondition({
      andIndex,
      fieldName: activeField.value,
      operator: internalOperatorOption,
      orIndex,
      value: debouncedValue,
    })
  }, [
    debouncedValue,
    andIndex,
    activeField?.value,
    internalOperatorOption,
    orIndex,
    updateCondition,
    operator,
  ])

  const booleanSelect =
    ['exists'].includes(internalOperatorOption) || activeField?.props?.type === 'checkbox'
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
                setActiveField(fields.find((f) => f.value === field.value))
                updateCondition({
                  andIndex,
                  fieldName: field.value,
                  operator,
                  orIndex,
                  value: internalQueryValue,
                })
              }}
              options={fields}
              value={fields.find((field) => activeField.value === field.value) || fields[0]}
            />
          </div>
          <div className={`${baseClass}__operator`}>
            <ReactSelect
              disabled={!activeField.value}
              isClearable={false}
              onChange={(operator) => {
                setInternalOperatorOption(operator.value)
                updateCondition({
                  andIndex,
                  fieldName: activeField.value,
                  operator: operator.value,
                  orIndex,
                  value: internalQueryValue,
                })
              }}
              options={activeField?.operators}
              value={
                activeField?.operators.find(
                  (operator) => internalOperatorOption === operator.value,
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
                disabled: !internalOperatorOption,
                onChange: setInternalQueryValue,
                operator: internalOperatorOption,
                options: valueOptions,
                relationTo:
                  activeField?.props?.type === 'relationship' &&
                  'fieldComponentProps' in activeField.props
                    ? (activeField?.props?.fieldComponentProps as RelationshipFieldProps)
                        ?.relationTo
                    : undefined,
                value: internalQueryValue ?? '',
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
              removeCondition({
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
              addCondition({
                andIndex,
                fieldName,
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
