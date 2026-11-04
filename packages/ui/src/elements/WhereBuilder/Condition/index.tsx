'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type {
  AddCondition,
  ReducedField,
  RemoveCondition,
  UpdateCondition,
  UpdateJoin,
  Value,
} from '../types.js'

export type Props = {
  readonly addCondition: AddCondition
  readonly andIndex: number
  readonly disableRemoveButton: boolean
  readonly fieldPath: string
  readonly filterOptions?: ResolvedFilterOptions
  readonly isFirstCondition: boolean
  readonly join: 'and' | 'or'
  readonly operator: Operator
  readonly orIndex: number
  readonly reducedFields: ReducedField[]
  readonly removeCondition: RemoveCondition
  readonly RenderedFilter?: React.ReactNode
  readonly updateCondition: UpdateCondition
  readonly updateJoin: UpdateJoin
  readonly value: Value
}

import type { Operator, Option as PayloadOption, ResolvedFilterOptions } from 'payload'

import { isFieldDisabled } from 'payload/shared'

import type { Option } from '../../ReactSelect/index.js'

import { useDebounce } from '../../../hooks/useDebounce.js'
import { useEffectEvent } from '../../../hooks/useEffectEvent.js'
import { LineIcon } from '../../../icons/Line/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { ReactSelect } from '../../ReactSelect/index.js'
import { getDateFilterOperatorValue, shouldSyncConditionValue } from '../conditionValue.js'
import { DefaultFilter } from './DefaultFilter/index.js'
import { getOperatorValueTypes } from './validOperators.js'
import './index.css'

const baseClass = 'condition'

export const Condition: React.FC<Props> = (props) => {
  const {
    andIndex,
    disableRemoveButton,
    fieldPath,
    filterOptions,
    isFirstCondition,
    join,
    operator,
    orIndex,
    reducedFields,
    removeCondition,
    RenderedFilter,
    updateCondition,
    updateJoin,
    value,
  } = props

  const { t } = useTranslation()

  const reducedField = reducedFields.find((field) => field.fieldPath === fieldPath)

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

  // Tracks the last row state reported upward so the downward sync can distinguish its echo from
  // an external field, operator, or value change.
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

  // Sync external row changes down, but skip our own committed echo so this never clobbers
  // in-progress typing.
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

  const disabled = !reducedField?.fieldPath || isFieldDisabled(reducedField?.field, 'filter')

  const handleFieldChange = useCallback(
    async (field: Option<string>) => {
      setInternalValue(undefined)
      await updateCondition({
        type: 'field',
        andIndex,
        field: reducedFields.find((option) => option.fieldPath === field.value),
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
        <div className={`${baseClass}__join`}>
          {isFirstCondition ? (
            <span className={`${baseClass}__join-label`}>{t('general:where')}</span>
          ) : (
            <ReactSelect
              aria-label={t('general:filter')}
              classNames={{
                menu: () => 'condition__join-menu',
              }}
              isClearable={false}
              onChange={(option: Option<'and' | 'or'>) =>
                updateJoin({ andIndex, join: option.value, orIndex })
              }
              options={[
                { label: t('general:and'), value: 'and' },
                { label: t('general:or'), value: 'or' },
              ]}
              value={{ label: join === 'and' ? t('general:and') : t('general:or'), value: join }}
            />
          )}
        </div>
        <div className={`${baseClass}__inputs`}>
          <div className={`${baseClass}__field`}>
            <ReactSelect
              aria-label={t('general:field')}
              disabled={disabled}
              filterOption={(option, inputValue) => {
                const label =
                  typeof option?.data?.plainTextLabel === 'string'
                    ? option.data.plainTextLabel
                    : option.label
                return label.toLowerCase().includes(inputValue.toLowerCase())
              }}
              isClearable={false}
              onChange={handleFieldChange}
              options={reducedFields
                .filter((field) => !isFieldDisabled(field.field, 'filter'))
                .map((f) => ({ ...f, value: f.fieldPath }))}
              value={reducedField ? { ...reducedField, value: reducedField.fieldPath } : undefined}
            />
          </div>
          <div className={`${baseClass}__operator`}>
            <ReactSelect
              aria-label={t('general:filter')}
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
                  !operator || !reducedField || isFieldDisabled(reducedField?.field, 'filter')
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
            aria-label={t('general:removeFilter')}
            buttonStyle="ghost"
            className={`${baseClass}__actions-remove`}
            disabled={disableRemoveButton}
            icon={<LineIcon size={24} />}
            onClick={() =>
              removeCondition({
                andIndex,
                orIndex,
              })
            }
          />
        </div>
      </div>
    </div>
  )
}
