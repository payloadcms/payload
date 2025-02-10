'use client'
import React, { useState } from 'react'

import type { ConditionOption } from '../types.js'

export type Props = {
  readonly addCondition: ({
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
  readonly andIndex: number
  readonly conditionOptions: ConditionOption[]
  readonly fieldName: string
  readonly operator: Operator
  readonly orIndex: number
  readonly removeCondition: ({ andIndex, orIndex }: { andIndex: number; orIndex: number }) => void
  readonly RenderedFilter: React.ReactNode
  readonly updateCondition: ({
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
  readonly value: string
}

import type { Operator, Option as PayloadOption } from 'payload'

import type { Option } from '../../ReactSelect/index.js'

import { useDebounce } from '../../../hooks/useDebounce.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { ReactSelect } from '../../ReactSelect/index.js'
import { DefaultFilter } from './DefaultFilter/index.js'
import './index.scss'

const baseClass = 'condition'

export const Condition: React.FC<Props> = (props) => {
  const {
    addCondition,
    andIndex,
    conditionOptions,
    fieldName,
    operator,
    orIndex,
    removeCondition,
    RenderedFilter,
    updateCondition,
    value,
  } = props

  const { t } = useTranslation()

  const conditionOption = conditionOptions.find((field) => field.value === fieldName)

  const [internalQueryValue, setInternalQueryValue] = useState<string>(value)

  const debouncedValue = useDebounce(internalQueryValue, 300)

  const booleanSelect = ['exists'].includes(operator) || conditionOption?.field?.type === 'checkbox'

  let valueOptions: PayloadOption[] = []

  if (booleanSelect) {
    valueOptions = [
      { label: t('general:true'), value: 'true' },
      { label: t('general:false'), value: 'false' },
    ]
  } else if (conditionOption?.field && 'options' in conditionOption.field) {
    valueOptions = conditionOption.field.options
  }

  const disabled =
    (!conditionOption?.value && typeof conditionOption?.value !== 'number') ||
    conditionOption?.field?.admin?.disableListFilter

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__inputs`}>
          <div className={`${baseClass}__field`}>
            <ReactSelect
              disabled={disabled}
              isClearable={false}
              onChange={(field: Option<string>) => {
                setInternalQueryValue(undefined)
                updateCondition({
                  andIndex,
                  fieldName: field.value,
                  operator,
                  orIndex,
                  value: undefined,
                })
              }}
              options={conditionOptions.filter((field) => !field.field.admin.disableListFilter)}
              value={
                conditionOption || {
                  value: conditionOption?.value,
                }
              }
            />
          </div>
          <div className={`${baseClass}__operator`}>
            <ReactSelect
              disabled={disabled}
              isClearable={false}
              onChange={(operator: Option<Operator>) => {
                updateCondition({
                  andIndex,
                  fieldName,
                  operator: operator.value,
                  orIndex,
                  value,
                })
              }}
              options={conditionOption?.operators}
              value={conditionOption?.operators.find((o) => operator === o.value) || null}
            />
          </div>
          <div className={`${baseClass}__value`}>
            {RenderedFilter || (
              <DefaultFilter
                booleanSelect={booleanSelect}
                disabled={
                  !operator || !conditionOption || conditionOption?.field?.admin?.disableListFilter
                }
                internalField={conditionOption}
                onChange={setInternalQueryValue}
                operator={operator}
                options={valueOptions}
                value={internalQueryValue ?? ''}
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
                fieldName: conditionOptions.find((field) => !field.field.admin?.disableListFilter)
                  .value,
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
