'use client'

import type { OptionObject } from 'payload'
import type React from 'react'
import type { ClearIndicatorProps, DropdownIndicatorProps, OptionProps } from 'react-select'

import { useMemo } from 'react'
import { components as rsComponents } from 'react-select'

import type { Option as OptionType } from '../ReactSelect/types.js'
import type { Props } from './types.js'

import { CheckIcon } from '../../icons/Check/index.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { CircledXIcon } from '../../icons/CircledX/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { ReactSelect } from '../ReactSelect/index.js'
import { formatOptions } from '../WhereBuilder/Condition/Select/formatOptions.js'
import './index.css'

const SmallDropdownIndicator: React.FC<DropdownIndicatorProps<OptionType, true>> = (props) => {
  const { innerProps, isDisabled } = props

  if (isDisabled) {
    return null
  }

  return (
    <div className="timezone-picker__dropdown-indicator" {...innerProps}>
      <ChevronIcon size={16} />
    </div>
  )
}

const SmallClearIndicator: React.FC<ClearIndicatorProps<OptionType, true>> = (props) => {
  const { clearValue } = props
  const { t } = useTranslation()

  return (
    <button
      aria-label={`${t('general:clear')} ${t('general:timezone')}`}
      className="timezone-picker__clear-indicator"
      onClick={(event) => {
        event.stopPropagation()
        const input = event.currentTarget
          .closest('.timezone-picker')
          ?.querySelector<HTMLInputElement>('[role="combobox"]')

        clearValue()
        input?.focus()
      }}
      onKeyDown={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.stopPropagation()
        }
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
      type="button"
    >
      <CircledXIcon size={24} />
    </button>
  )
}

const TimezoneOption: React.FC<OptionProps<OptionType, false>> = (props) => {
  const { children } = props

  return (
    <rsComponents.Option {...props}>
      <CheckIcon className="timezone-picker__option-check" size={16} />
      <span className="timezone-picker__option-label">{children}</span>
    </rsComponents.Option>
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
      <label className="timezone-picker__label" htmlFor={id}>
        {t('general:timezone')}
        {required && <span className="timezone-picker__required">*</span>}
      </label>
      <ReactSelect
        className="timezone-picker"
        classNames={{
          menu: () => 'timezone-picker__menu',
          menuList: () => 'timezone-picker__menu-list',
        }}
        components={{
          ClearIndicator: SmallClearIndicator,
          DropdownIndicator: SmallDropdownIndicator,
          Option: TimezoneOption,
        }}
        customProps={{ menuPortalTheme: 'dark' }}
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
        styles={{
          control: (base) => ({
            ...base,
            flexWrap: 'nowrap',
          }),
          option: (base) => ({
            ...base,
            alignItems: 'center',
            display: 'flex',
            gap: 'var(--spacer-1)',
            minWidth: 0,
          }),
        }}
        value={selectedTimezone}
      />
    </div>
  )
}
