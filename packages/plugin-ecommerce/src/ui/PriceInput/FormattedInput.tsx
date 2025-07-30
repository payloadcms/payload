'use client'

import type { StaticLabel } from 'payload'

import { FieldLabel } from '@payloadcms/ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { Currency } from '../../types.js'

import { USD } from '../../currencies/index.js'
import { convertFromBaseValue, convertToBaseValue } from '../utilities.js'

interface Props {
  currency: string
  disabled?: boolean
  error?: string
  id?: string
  label?: StaticLabel
  onChange: (value: null | number) => void
  placeholder?: string
  supportedCurrencies: Currency[]
  value: number
}

const baseClass = 'formattedPrice'

export const FormattedInput: React.FC<Props> = ({
  id,
  currency: currencyFromProps,
  disabled = false,
  label,
  onChange: onChangeFromProps,
  placeholder = '0.00',
  supportedCurrencies,
  value,
}) => {
  const [displayValue, setDisplayValue] = useState<string>('')

  const inputRef = useRef<HTMLInputElement>(null)
  const isFirstRender = useRef(true)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const currency = useMemo<Currency>(() => {
    if (currencyFromProps && supportedCurrencies) {
      const foundCurrency = supportedCurrencies.find(
        (supportedCurrency) => supportedCurrency.code === currencyFromProps,
      )

      return foundCurrency ?? supportedCurrencies[0] ?? USD
    }

    return supportedCurrencies[0] ?? USD
  }, [currencyFromProps, supportedCurrencies])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false

      if (value === undefined || value === null) {
        setDisplayValue('')
      } else {
        setDisplayValue(convertFromBaseValue({ baseValue: value, currency }))
      }
    }
  }, [currency, value, currencyFromProps])

  const updateValue = useCallback(
    (inputValue: string) => {
      if (inputValue === '') {
        onChangeFromProps(null)

        return
      }

      const baseValue = convertToBaseValue({ currency, displayValue: inputValue })

      onChangeFromProps(baseValue)
    },
    [currency, onChangeFromProps],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      if (!/^\d*(?:\.\d*)?$/.test(inputValue) && inputValue !== '') {
        return
      }

      setDisplayValue(inputValue)

      // Clear any existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      // Only update the base value after a delay to avoid formatting while typing
      debounceTimer.current = setTimeout(() => {
        updateValue(inputValue)
      }, 500)
    },
    [updateValue, setDisplayValue],
  )

  const handleInputBlur = useCallback(() => {
    if (displayValue === '') {
      return
    }

    // Clear any pending debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }

    const baseValue = convertToBaseValue({ currency, displayValue })
    const formattedValue = convertFromBaseValue({ baseValue, currency })

    if (value != baseValue) {
      onChangeFromProps(baseValue)
    }

    setDisplayValue(formattedValue)
  }, [currency, displayValue, onChangeFromProps, value])

  return (
    <div className={`field-type number ${baseClass}`}>
      {label && <FieldLabel htmlFor={id} label={label} />}

      <div className={`${baseClass}Container`}>
        <div className={`${baseClass}CurrencySymbol`}>
          <span>{currency.symbol}</span>
        </div>

        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <input
          className={`${baseClass}Input`}
          disabled={disabled}
          id={id}
          onBlur={handleInputBlur}
          onChange={handleInputChange}
          placeholder={placeholder}
          ref={inputRef}
          type="text"
          value={displayValue}
        />
      </div>
    </div>
  )
}
