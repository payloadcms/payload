'use client'
import React, { useCallback, useEffect, useState } from 'react'

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
  readonly filterOptions: ResolvedFilterOptions
  readonly operator: Operator
  readonly orIndex: number
  readonly reducedFields: ReducedField[]
  readonly removeCondition: RemoveCondition
  readonly RenderedFilter: React.ReactNode
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

  const [internalValue, setInternalValue] = useState<Value>(value)

  const debouncedValue = useDebounce(internalValue, 300)

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

  // Track if this is the initial mount to avoid unnecessary updates
  const isInitialMount = React.useRef(true)
  const previousValue = React.useRef(value)
  // Track if the filter has ever had a non-empty value (for removal logic)
  const hasHadNonEmptyValue = React.useRef(value !== null && value !== undefined && value !== '')

  const updateValue = useEffectEvent((debouncedValue: Value) => {
    if (operator) {
      const isEmpty =
        debouncedValue === null || debouncedValue === undefined || debouncedValue === ''

      // If the value is now empty but previously had a value, remove the condition
      // This prevents filtering for "equals empty string" which returns 0 results
      if (isEmpty && hasHadNonEmptyValue.current) {
        removeCondition({ andIndex, orIndex })
        return
      }

      // Track that we've had a non-empty value
      if (!isEmpty) {
        hasHadNonEmptyValue.current = true
      }

      updateCondition({
        type: 'value',
        andIndex,
        field: reducedField,
        operator,
        orIndex,
        // Keep empty string as-is to preserve the filter in URL
        // Only convert null to empty string
        value: debouncedValue === null ? '' : debouncedValue,
      })
    }
  })

  useEffect(() => {
    // Skip the initial mount to avoid immediately removing new empty filters
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    // Only update if the value actually changed from what was passed in
    if (debouncedValue !== previousValue.current) {
      previousValue.current = debouncedValue
      updateValue(debouncedValue)
    }
  }, [debouncedValue])

  const disabled =
    (!reducedField?.value && typeof reducedField?.value !== 'number') ||
    reducedField?.field?.admin?.disableListFilter

  const handleFieldChange = useCallback(
    (field: Option<string>) => {
      setInternalValue('')
      updateCondition({
        type: 'field',
        andIndex,
        field: reducedFields.find((option) => option.value === field.value),
        operator,
        orIndex,
        value: '',
      })
    },
    [andIndex, operator, orIndex, reducedFields, updateCondition],
  )

  const handleOperatorChange = useCallback(
    (operator: Option<Operator>) => {
      const operatorValueTypes = getOperatorValueTypes(reducedField.field.type)
      const validOperatorValue = operatorValueTypes[operator.value] || 'any'
      const isValidValue =
        validOperatorValue === 'any' ||
        typeof value === validOperatorValue ||
        (validOperatorValue === 'boolean' && (value === 'true' || value === 'false'))

      if (!isValidValue) {
        // if the current value is not valid for the new operator
        // reset the value before passing it to updateCondition
        setInternalValue('')
      }

      updateCondition({
        type: 'operator',
        andIndex,
        field: reducedField,
        operator: operator.value,
        orIndex,
        value: isValidValue ? value : '',
      })
    },
    [andIndex, reducedField, orIndex, updateCondition, value],
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
