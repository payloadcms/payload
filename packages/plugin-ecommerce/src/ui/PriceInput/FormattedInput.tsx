'use client'

import type { StaticDescription, StaticLabel } from '@ruya.sa/payload'

import { FieldDescription, FieldLabel, useField, useFormFields } from '@ruya.sa/ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { Currency } from '../../types/index.js'

import { USD } from '../../currencies/index.js'
import { convertFromBaseValue, convertToBaseValue } from '../utilities.js'

interface Props {
  currency?: Currency
  description?: StaticDescription
  disabled?: boolean
  error?: string
  id?: string
  label?: StaticLabel
  path: string
  placeholder?: string
  readOnly?: boolean
  supportedCurrencies: Currency[]
}

const baseClass = 'formattedPrice'

export const FormattedInput: React.FC<Props> = ({
  id: idFromProps,
  currency: currencyFromProps,
  description,
  disabled = false,
  label,
  path,
  placeholder = '0.00',
  readOnly,
  supportedCurrencies,
}) => {
  const { setValue, value } = useField<number>({ path })
  const [displayValue, setDisplayValue] = useState<string>('')

  const inputRef = useRef<HTMLInputElement>(null)
  const isFirstRender = useRef(true)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const parentPath = path.split('.').slice(0, -1).join('.')
  const currencyPath = parentPath ? `${parentPath}.currency` : 'currency'

  const currencyFromSelectField = useFormFields(([fields, _]) => fields[currencyPath])

  const currencyCode = currencyFromProps?.code ?? (currencyFromSelectField?.value as string)
  const id = idFromProps || path

  const currency = useMemo<Currency>(() => {
    if (currencyCode && supportedCurrencies) {
      const foundCurrency = supportedCurrencies.find(
        (supportedCurrency) => supportedCurrency.code === currencyCode,
      )

      return foundCurrency ?? supportedCurrencies[0] ?? USD
    }

    return supportedCurrencies[0] ?? USD
  }, [currencyCode, supportedCurrencies])

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
        setValue(null)

        return
      }

      const baseValue = convertToBaseValue({ currency, displayValue: inputValue })

      setValue(baseValue)
    },
    [currency, setValue],
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
      setValue(baseValue)
    }

    setDisplayValue(formattedValue)
  }, [currency, displayValue, setValue, value])

  return (
    <div className={`field-type number ${baseClass}`}>
      {label && <FieldLabel as="label" htmlFor={id} label={label} />}

      <div className={`${baseClass}Container`}>
        <div className={`${baseClass}CurrencySymbol`}>
          <span>{currency.symbol}</span>
        </div>

        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <input
          className={`${baseClass}Input`}
          disabled={disabled || readOnly}
          id={id}
          onBlur={handleInputBlur}
          onChange={handleInputChange}
          placeholder={placeholder}
          ref={inputRef}
          type="text"
          value={displayValue}
        />
      </div>
      <FieldDescription
        className={`${baseClass}Description`}
        description={description}
        path={path}
      />
    </div>
  )
}
