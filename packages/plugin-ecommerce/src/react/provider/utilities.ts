import type { Currency } from '../../types/index.js'

/**
 * Convert base value to display value with decimal point (e.g., 2500 to $25.00)
 */
export const convertFromBaseValue = ({
  baseValue,
  currency,
}: {
  baseValue: number
  currency: Currency
}): string => {
  if (!currency) {
    return baseValue.toString()
  }

  // Convert from base value (e.g., cents) to decimal value (e.g., dollars)
  const decimalValue = baseValue / Math.pow(10, currency.decimals)

  // Format with the correct number of decimal places
  return decimalValue.toFixed(currency.decimals)
}
