'use client'
import type { ChangeEvent } from 'react'

import { getTranslation } from '@payloadcms/translations'
import { isNumber } from 'payload/shared'
import React from 'react'

import type { NumberInputProps } from './types.js'

import { InputStepper } from '../../elements/InputStepper/index.js'
import { ReactSelect } from '../../elements/ReactSelect/index.js'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.css'

const baseClass = 'number'

export const NumberInput: React.FC<NumberInputProps> = (props) => {
  const {
    AfterInput,
    BeforeInput,
    className,
    Description,
    description,
    Error,
    hasMany,
    Label,
    label,
    localized,
    max = Infinity,
    maxRows = Infinity,
    min = -Infinity,
    onChange,
    onStep,
    path,
    placeholder: placeholderFromProps,
    readOnly,
    required,
    showError,
    step = 1,
    style,
    value,
    valueToRender,
  } = props

  const { i18n, t } = useTranslation()

  const placeholder =
    getTranslation(placeholderFromProps, i18n) || (hasMany ? t('general:enterANumber') : undefined)

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        readOnly && 'read-only',
        hasMany && 'has-many',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={
          <FieldLabel label={label} localized={localized} path={path} required={required} />
        }
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <RenderCustomComponent
          CustomComponent={Error}
          Fallback={<FieldError path={path} showError={showError} />}
        />
        {BeforeInput}
        {hasMany ? (
          <ReactSelect
            className={`field-${path.replace(/\./g, '__')}`}
            components={{ DropdownIndicator: null }}
            disabled={readOnly}
            filterOption={(_, rawInput) => {
              const isOverHasMany = Array.isArray(value) && (value as number[]).length >= maxRows
              return isNumber(rawInput) && !isOverHasMany
            }}
            isClearable
            isCreatable
            isMulti
            isSortable
            noOptionsMessage={() => {
              const isOverHasMany = Array.isArray(value) && (value as number[]).length >= maxRows
              if (isOverHasMany) {
                return t('validation:limitReached', {
                  max: maxRows,
                  value: (value as number[]).length + 1,
                })
              }
              return null
            }}
            onChange={onChange}
            options={[]}
            placeholder={placeholder}
            showError={showError}
            value={valueToRender}
          />
        ) : (
          <div className="form-input-group">
            <input
              aria-label={getTranslation(label, i18n) || path}
              className="form-input"
              disabled={readOnly}
              id={`field-${path.replace(/\./g, '__')}`}
              max={max}
              min={min}
              name={path}
              onChange={onChange as (e: ChangeEvent<HTMLInputElement>) => void}
              onWheel={(e) => {
                // @ts-expect-error - blur() exists on input elements but not typed on EventTarget
                e.target.blur()
              }}
              placeholder={placeholder}
              step={step}
              type="number"
              value={typeof value === 'number' ? value : ''}
            />
            {onStep && (
              <InputStepper
                disabled={readOnly}
                onDecrement={() => onStep('down')}
                onIncrement={() => onStep('up')}
              />
            )}
          </div>
        )}
        {AfterInput}
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </div>
    </div>
  )
}
