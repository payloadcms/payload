'use client'
import React, { useEffect, useState } from 'react'

import type { FieldCondition } from '../types.js'

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
  readonly fieldName: string
  readonly initialValue: string
  readonly operator: Operator
  readonly options: FieldCondition[]
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
}

import type { Operator } from 'payload'

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
    fieldName,
    initialValue,
    operator,
    options,
    orIndex,
    removeCondition,
    RenderedFilter,
    updateCondition,
  } = props

  const [fieldOption, setFieldOption] = useState<FieldCondition>(() =>
    options.find((field) => fieldName === field.value),
  )

  const { t } = useTranslation()
  const [internalOperatorOption, setInternalOperatorOption] = useState<Operator>(operator)
  const [internalQueryValue, setInternalQueryValue] = useState<string>(initialValue)

  const debouncedValue = useDebounce(internalQueryValue, 300)

  useEffect(() => {
    // This is to trigger changes when the debounced value changes
    if (
      (fieldOption?.value || typeof fieldOption?.value === 'number') &&
      internalOperatorOption &&
      ![null, undefined].includes(debouncedValue)
    ) {
      updateCondition({
        andIndex,
        fieldName: fieldOption.value,
        operator: internalOperatorOption,
        orIndex,
        value: debouncedValue,
      })
    }
  }, [
    debouncedValue,
    andIndex,
    fieldOption?.value,
    internalOperatorOption,
    orIndex,
    updateCondition,
    operator,
  ])

  const booleanSelect =
    ['exists'].includes(internalOperatorOption) || fieldOption?.field?.type === 'checkbox'

  let valueOptions

  if (booleanSelect) {
    valueOptions = [
      { label: t('general:true'), value: 'true' },
      { label: t('general:false'), value: 'false' },
    ]
  } else if (fieldOption?.field && 'options' in fieldOption.field) {
    valueOptions = fieldOption.field.options
  }

  const disabled =
    (!fieldOption?.value && typeof fieldOption?.value !== 'number') ||
    fieldOption?.field?.admin?.disableListFilter

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__inputs`}>
          <div className={`${baseClass}__field`}>
            <ReactSelect
              disabled={disabled}
              isClearable={false}
              onChange={(field: Option) => {
                setFieldOption(options.find((f) => f.value === field.value))
                setInternalOperatorOption(undefined)
                setInternalQueryValue(undefined)
              }}
              options={options.filter((field) => !field.field.admin.disableListFilter)}
              value={
                options.find((field) => fieldOption?.value === field.value) || {
                  value: fieldOption?.value,
                }
              }
            />
          </div>
          <div className={`${baseClass}__operator`}>
            <ReactSelect
              disabled={disabled}
              isClearable={false}
              onChange={(operator: Option<Operator>) => {
                setInternalOperatorOption(operator.value)
              }}
              options={fieldOption?.operators}
              value={
                fieldOption?.operators.find(
                  (operator) => internalOperatorOption === operator.value,
                ) || null
              }
            />
          </div>
          <div className={`${baseClass}__value`}>
            {RenderedFilter || (
              <DefaultFilter
                booleanSelect={booleanSelect}
                disabled={
                  !internalOperatorOption ||
                  !fieldOption ||
                  fieldOption?.field?.admin?.disableListFilter
                }
                internalField={fieldOption}
                onChange={setInternalQueryValue}
                operator={internalOperatorOption}
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
                fieldName: options.find((field) => !field.field.admin?.disableListFilter).value,
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
