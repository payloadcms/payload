'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { currency, convertFromBaseValue, convertToBaseValue } from './utilities'

interface Props {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  label?: string
  error?: string
}

const baseClass = 'formattedPrice'

export const FormattedInput: React.FC<Props> = ({
  value,
  onChange,
  placeholder = '0.00',
  disabled = false,
  id,
  label,
}) => {
  const [displayValue, setDisplayValue] = useState<string>('')

  const inputRef = useRef<HTMLInputElement>(null)
  const isFirstRender = useRef(true)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      setDisplayValue(convertFromBaseValue(value))
    }
  }, [value])

  const updateValue = useCallback(
    (inputValue: string) => {
      const baseValue = convertToBaseValue(inputValue)
      onChange(baseValue)
    },
    [onChange],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    if (!/^[0-9]*\.?[0-9]*$/.test(inputValue) && inputValue !== '') {
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
  }

  const handleInputBlur = () => {
    if (displayValue === '') return

    // Clear any pending debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }

    const baseValue = convertToBaseValue(displayValue)
    const formattedValue = convertFromBaseValue(baseValue)
    if (value != baseValue) {
      onChange(baseValue)
    }
    setDisplayValue(formattedValue)
  }

  return (
    <div className={`${baseClass}`}>
      {label && (
        <label htmlFor={id} className={`${baseClass}Label`}>
          {label}
        </label>
      )}

      <div className={`${baseClass}Container field-type number`}>
        <div className={`${baseClass}CurrencySymbol`}>
          <span>{currency.symbol}</span>
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseClass}Input`}
        />
      </div>
    </div>
  )
}
