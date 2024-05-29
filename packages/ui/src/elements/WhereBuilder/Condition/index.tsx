'use client'
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
    rawQuery,
    value,
  }: {
    andIndex: number
    fieldName?: string
    operator: string
    orIndex: number
    rawQuery?: Record<string, any>
    value?: string
  }) => void
}

import { RenderCustomClientComponent } from '../../../elements/RenderCustomClientComponent/index.js'
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

type BuildRawPolymorphicRelationshipWhereQueryArgs = {
  fieldName: string
  operator: 'in' | 'not_in'
  polyRelationshipValues: {
    relationTo: string
    value: number | string
  }[]
}

function buildRawPolymorphicRelationshipWhereQuery({
  fieldName,
  operator,
  polyRelationshipValues,
}: BuildRawPolymorphicRelationshipWhereQueryArgs) {
  const keys = {
    constraint: operator === 'in' ? 'and' : 'or',
    equality: operator === 'in' ? 'equals' : 'not_equals',
    // in: any constraints must be true
    // not_in: all constraints must be true
    inclusion: operator === 'in' ? 'or' : 'and',
  }

  const relationQueries = []
  polyRelationshipValues.map((relation, i) => {
    relationQueries[i] = {
      [keys.constraint]: [
        {
          [`${fieldName}.relationTo`]: {
            [keys.equality]: relation.relationTo,
          },
        },
        {
          [`${fieldName}.value`]: {
            [keys.equality]: relation.value,
          },
        },
      ],
    }
  })

  return { [keys.inclusion]: relationQueries }
}

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
  const [internalField, setInternalField] = useState<FieldCondition>(() =>
    fields.find((field) => fieldName === field.value),
  )
  const [internalOperatorOption, setInternalOperatorOption] = useState(operator)
  const [internalQueryValue, setInternalQueryValue] = useState<string>(initialValue)
  const debouncedValue = useDebounce(internalQueryValue, 300)

  useEffect(() => {
    // This is to trigger changes when the debounced value changes
    if (
      internalField?.value &&
      internalOperatorOption &&
      ![null, undefined].includes(debouncedValue)
    ) {
      if (
        'relationTo' in internalField.props &&
        Array.isArray(internalField.props.relationTo) &&
        Array.isArray(debouncedValue)
      ) {
        updateCondition({
          andIndex,
          operator: internalOperatorOption,
          orIndex,
          rawQuery: buildRawPolymorphicRelationshipWhereQuery({
            fieldName: internalField.value,
            operator:
              internalOperatorOption as BuildRawPolymorphicRelationshipWhereQueryArgs['operator'],
            polyRelationshipValues: debouncedValue,
          }),
        })
      } else {
        updateCondition({
          andIndex,
          fieldName: internalField.value,
          operator: internalOperatorOption,
          orIndex,
          value: debouncedValue,
        })
      }
    }
  }, [
    debouncedValue,
    andIndex,
    internalField?.value,
    internalField?.props,
    internalOperatorOption,
    orIndex,
    updateCondition,
    operator,
  ])

  const booleanSelect =
    ['exists'].includes(internalOperatorOption) || internalField?.props?.type === 'checkbox'
  const ValueComponent = booleanSelect
    ? Select
    : valueFields[internalField?.component] || valueFields.Text

  let valueOptions
  if (booleanSelect) {
    valueOptions = ['true', 'false']
  } else if (internalField?.props && 'options' in internalField.props) {
    valueOptions = internalField.props.options
  }
  console.log('internalQueryValue', internalQueryValue)
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__inputs`}>
          <div className={`${baseClass}__field`}>
            <ReactSelect
              isClearable={false}
              onChange={(field) => {
                setInternalField(fields.find((f) => f.value === field.value))
                setInternalOperatorOption(undefined)
                setInternalQueryValue(undefined)
              }}
              options={fields}
              value={fields.find((field) => internalField?.value === field.value) || fields[0]}
            />
          </div>
          <div className={`${baseClass}__operator`}>
            <ReactSelect
              disabled={!internalField?.value}
              isClearable={false}
              onChange={(operator) => {
                setInternalOperatorOption(operator.value)
              }}
              options={internalField?.operators}
              value={
                internalField?.operators.find(
                  (operator) => internalOperatorOption === operator.value,
                ) || null
              }
            />
          </div>
          <div className={`${baseClass}__value`}>
            <RenderCustomClientComponent
              CustomComponent={internalField?.props?.admin?.components?.Filter}
              DefaultComponent={ValueComponent}
              componentProps={{
                ...internalField?.props,
                disabled: !internalOperatorOption,
                onChange: setInternalQueryValue,
                operator: internalOperatorOption,
                options: valueOptions,
                relationTo:
                  internalField?.props?.type === 'relationship' &&
                  'cellProps' in internalField.props &&
                  typeof internalField.props.cellProps === 'object' &&
                  'relationTo' in internalField.props.cellProps
                    ? internalField.props.cellProps?.relationTo
                    : undefined,
                // value: internalQueryValue ?? '',
                // value: [],
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
                andIndex: andIndex + 1,
                fieldName: fields[0].value,
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
