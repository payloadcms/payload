'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type {
  AddCondition,
  ReducedField,
  RemoveCondition,
  UpdateCondition,
  Value,
} from '../types.js'

export type Props = {
  readonly addCondition: AddCondition
  readonly andIndex: number
  readonly fieldPath: string
  readonly filterOptions?: ResolvedFilterOptions
  readonly operator: Operator
  readonly orIndex: number
  readonly reducedFields: ReducedField[]
  readonly removeCondition: RemoveCondition
  readonly RenderedFilter?: React.ReactNode
  readonly updateCondition: UpdateCondition
  readonly value: Value
}

import type { Operator, Option as PayloadOption, ResolvedFilterOptions } from 'payload'

import type { Option } from '../../ReactSelect/index.js'

import { useDebounce } from '../../../hooks/useDebounce.js'
import { useEffectEvent } from '../../../hooks/useEffectEvent.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { ReactSelect } from '../../ReactSelect/index.js'
import { getDateFilterOperatorValue, shouldSyncConditionValue } from './Date/getDateFilterValue.js'
import { DefaultFilter } from './DefaultFilter/index.js'
import { getOperatorValueTypes } from './validOperators.js'
import './index.scss'

const baseClass = 'condition'

export const Condition: React.FC<Props> = (props) => {
  const {
    addCondition,
    andIndex,
    fieldPath,
    filterOptions,
    operator,
    orIndex,
    reducedFields,
    removeCondition,
    RenderedFilter,
    updateCondition,
    value,
  } = props

  const { t } = useTranslation()

  const reducedField = reducedFields.find((field) => field.value === fieldPath)

  const normalizeDateValue = useCallback(
    (value: Value): Value =>
      reducedField?.field.type === 'date'
        ? getDateFilterOperatorValue({
            operator,
            pickerAppearance: reducedField.field.admin?.date?.pickerAppearance,
            value,
          })
        : value,
    [operator, reducedField],
  )

  const [internalValue, setInternalValue] = useState<Value>(() => normalizeDateValue(value))

  const debouncedValue = useDebounce(internalValue, 300)
  const lastReportedCondition = useRef({ fieldPath, operator, value })

  const booleanSelect = ['exists'].includes(operator) || reducedField?.field?.type === 'checkbox'

  let valueOptions: PayloadOption[] = []

  if (booleanSelect) {
    valueOptions = [
      { label: t('general:true'), value: 'true' },
      { label: t('general:false'), value: 'false' },
    ]
  } else if (reducedField?.field && 'options' in reducedField.field) {
    valueOptions = reducedField.field.options
  }

  const updateValue = useEffectEvent(async (debouncedValue: Value) => {
    if (operator) {
      const normalizedValue =
        debouncedValue === null || debouncedValue === '' ? undefined : debouncedValue

      lastReportedCondition.current = { fieldPath, operator, value: normalizedValue }
      await updateCondition({
        type: 'value',
        andIndex,
        field: reducedField,
        operator,
        orIndex,
        value: normalizedValue,
      })
    }
  })

  useEffect(() => {
    void updateValue(debouncedValue)
  }, [debouncedValue])

  useEffect(() => {
    const lastReported = lastReportedCondition.current

    if (
      shouldSyncConditionValue({
        fieldPath,
        lastFieldPath: lastReported.fieldPath,
        lastOperator: lastReported.operator,
        lastReportedValue: lastReported.value,
        operator,
        value,
      })
    ) {
      lastReportedCondition.current = { fieldPath, operator, value }
      setInternalValue(normalizeDateValue(value))
    }
  }, [fieldPath, normalizeDateValue, operator, value])

  const disabled =
    (!reducedField?.value && typeof reducedField?.value !== 'number') ||
    reducedField?.field?.admin?.disableListFilter

  const handleFieldChange = useCallback(
    async (field: Option<string>) => {
      setInternalValue(undefined)
      await updateCondition({
        type: 'field',
        andIndex,
        field: reducedFields.find((option) => option.value === field.value),
        operator,
        orIndex,
        value: undefined,
      })
    },
    [andIndex, operator, orIndex, reducedFields, updateCondition],
  )

  const handleOperatorChange = useCallback(
    async (operator: Option<Operator>) => {
      const operatorValueTypes = getOperatorValueTypes(reducedField.field.type)
      const validOperatorValue = operatorValueTypes[operator.value] || 'any'
      const nextValue =
        reducedField.field.type === 'date'
          ? getDateFilterOperatorValue({
              operator: operator.value,
              pickerAppearance: reducedField.field.admin?.date?.pickerAppearance,
              value: internalValue,
            })
          : internalValue
      const isValidValue =
        validOperatorValue === 'any' ||
        typeof nextValue === validOperatorValue ||
        (validOperatorValue === 'boolean' && (nextValue === 'true' || nextValue === 'false'))

      if (!isValidValue) {
        // if the current value is not valid for the new operator
        // reset the value before passing it to updateCondition
        setInternalValue(undefined)
      } else if (nextValue !== internalValue) {
        setInternalValue(nextValue)
      }

      await updateCondition({
        type: 'operator',
        andIndex,
        field: reducedField,
        operator: operator.value,
        orIndex,
        value: isValidValue ? nextValue : undefined,
      })
    },
    [andIndex, internalValue, reducedField, orIndex, updateCondition],
  )

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__inputs`}>
          <div className={`${baseClass}__field`}>
            <ReactSelect
              disabled={disabled}
              filterOption={(option, inputValue) =>
                ((option?.data?.plainTextLabel as string) || option.label)
                  .toLowerCase()
                  .includes(inputValue.toLowerCase())
              }
              isClearable={false}
              onChange={handleFieldChange}
              options={reducedFields.filter((field) => !field.field.admin.disableListFilter)}
              value={
                reducedField || {
                  value: reducedField?.value,
                }
              }
            />
          </div>
          <div className={`${baseClass}__operator`}>
            <ReactSelect
              disabled={disabled}
              isClearable={false}
              onChange={handleOperatorChange}
              options={reducedField?.operators}
              value={reducedField?.operators.find((o) => operator === o.value) || null}
            />
          </div>
          <div className={`${baseClass}__value`}>
            {RenderedFilter || (
              <DefaultFilter
                booleanSelect={booleanSelect}
                disabled={
                  !operator || !reducedField || reducedField?.field?.admin?.disableListFilter
                }
                filterOptions={filterOptions}
                internalField={reducedField}
                onChange={setInternalValue}
                operator={operator}
                options={valueOptions}
                value={internalValue ?? ''}
              />
            )}
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
                field: reducedFields.find((field) => !field.field.admin?.disableListFilter),
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
