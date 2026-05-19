'use client'

import type { OptionObject } from 'payload'
import type React from 'react'
import type { JSX } from 'react'
import type { ClearIndicatorProps, DropdownIndicatorProps, StylesConfig } from 'react-select'

import { useMemo } from 'react'

import type { Option as OptionType } from '../ReactSelect/types.js'
import type { Props } from './types.js'

import { ChevronIcon } from '../../icons/Chevron/index.js'
import { CircledXIcon } from '../../icons/CircledX/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ReactSelect } from '../ReactSelect/index.js'
import { formatOptions } from '../WhereBuilder/Condition/Select/formatOptions.js'
import './index.css'

const SmallDropdownIndicator: React.FC<
  {
    innerProps: JSX.IntrinsicElements['button']
  } & DropdownIndicatorProps<OptionType, true>
> = (props) => {
  const {
    innerProps: { ref, ...restInnerProps },
  } = props

  return (
    <button
      className="timezone-picker__dropdown-indicator"
      ref={ref}
      {...restInnerProps}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.key = ' '
        }
      }}
      type="button"
    >
      <ChevronIcon size={16} />
    </button>
  )
}

const SmallClearIndicator: React.FC<ClearIndicatorProps<OptionType, true>> = (props) => {
  const {
    clearValue,
    innerProps: { ref, ...restInnerProps },
  } = props

  return (
    <div
      className="timezone-picker__clear-indicator"
      ref={typeof ref === 'string' ? null : ref}
      {...restInnerProps}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          clearValue()
          e.stopPropagation()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <CircledXIcon size={24} />
    </div>
  )
}

export const TimezonePicker: React.FC<Props> = (props) => {
  const {
    id,
    onChange: onChangeFromProps,
    options: optionsFromProps,
    readOnly: readOnlyFromProps,
    required,
    selectedTimezone: selectedTimezoneFromProps,
  } = props

  const { t } = useTranslation()

  const options = formatOptions(optionsFromProps)

  const selectedTimezone = useMemo(() => {
    return options.find((t) => {
      const value = typeof t === 'string' ? t : t.value
      return value === selectedTimezoneFromProps
    })
  }, [options, selectedTimezoneFromProps])

  const readOnly = Boolean(readOnlyFromProps) || options.length === 1

  return (
    <div className="timezone-picker-wrapper">
      <span className="timezone-picker__label">
        {t('general:timezone')}
        {required && <span className="timezone-picker__required">*</span>}
      </span>
      <ReactSelect
        className="timezone-picker"
        components={{
          ClearIndicator: SmallClearIndicator,
          DropdownIndicator: SmallDropdownIndicator,
        }}
        disabled={readOnly}
        inputId={id}
        isClearable={!required}
        isCreatable={false}
        onChange={(val: OptionObject) => {
          if (onChangeFromProps) {
            onChangeFromProps(val?.value || '')
          }
        }}
        options={options}
        placeholder={t('general:none')}
        styles={
          {
            control: (base) => ({
              ...base,
              flexWrap: 'nowrap',
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor:
                state.isFocused || state.isSelected
                  ? 'var(--color-bg-selected-strong)'
                  : 'transparent',
              color:
                state.isFocused || state.isSelected
                  ? 'var(--color-text-onselected-strong)'
                  : 'var(--color-text-ontooltip)',
            }),
          } as StylesConfig<OptionType>
        }
        value={selectedTimezone}
      />
    </div>
  )
}
