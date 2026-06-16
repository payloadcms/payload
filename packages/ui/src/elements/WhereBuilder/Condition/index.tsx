'use client'
import React, { useCallback, useEffect, useState } from 'react'

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
import { DefaultFilter } from './DefaultFilter/index.js'
import { getOperatorValueTypes } from './validOperators.js'
import './index.css'

const baseClass = 'condition'

export const Condition: React.FC<Props> = (props) => {
  const {
    andIndex,
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

  const updateValue = useEffectEvent(async (debouncedValue: Value) => {
    if (operator) {
      await updateCondition({
        type: 'value',
        andIndex,
        field: reducedField,
        operator,
        orIndex,
        value: debouncedValue === null || debouncedValue === '' ? undefined : debouncedValue,
      })
    }
  })

  useEffect(() => {
    void updateValue(debouncedValue)
  }, [debouncedValue])

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
      const isValidValue =
        validOperatorValue === 'any' ||
        typeof value === validOperatorValue ||
        (validOperatorValue === 'boolean' && (value === 'true' || value === 'false'))

      if (!isValidValue) {
        // if the current value is not valid for the new operator
        // reset the value before passing it to updateCondition
        setInternalValue(undefined)
      }

      await updateCondition({
        type: 'operator',
        andIndex,
        field: reducedField,
        operator: operator.value,
        orIndex,
        value: isValidValue ? value : undefined,
      })
    },
    [andIndex, reducedField, orIndex, updateCondition, value],
  )

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__join`}>
          {isFirstCondition ? (
            <span className={`${baseClass}__join-label`}>{t('general:where')}</span>
          ) : (
            <ReactSelect
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
              disabled={disabled}
              filterOption={(option, inputValue) =>
                ((option?.data?.plainTextLabel as string) || option.label)
                  .toLowerCase()
                  .includes(inputValue.toLowerCase())
              }
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
            buttonStyle="ghost"
            className={`${baseClass}__actions-remove`}
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
