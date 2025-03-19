/**
 * Feel free to change this to the currency you need. In the future we will support dynamic currencies.
 *
 * Common currencies:
 * ```ts
 * [
    { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
    { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 },
    { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2 },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0 },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2 },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2 },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimalPlaces: 2 },
    { code: 'BTC', symbol: '₿', name: 'Bitcoin', decimalPlaces: 8 },
    { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', decimalPlaces: 18 },
  ]
  ```
 */
export const currency = { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 }

// Convert display value with decimal point to base value (e.g., $25.00 to 2500)
export const convertToBaseValue = (displayValue: string): number => {
  if (!currency) {
    return parseFloat(displayValue)
  }

  // Remove currency symbol and any non-numeric characters except decimal
  const cleanValue = displayValue.replace(currency.symbol, '').replace(/[^0-9.]/g, '')

  // Parse the clean value to a float
  const floatValue = parseFloat(cleanValue || '0')

  // Convert to the base value (e.g., cents for USD)
  return Math.round(floatValue * Math.pow(10, currency.decimalPlaces))
}

// Convert base value to display value with decimal point (e.g., 2500 to $25.00)
export const convertFromBaseValue = (baseValue: number): string => {
  if (!currency) {
    return baseValue.toString()
  }

  // Convert from base value (e.g., cents) to decimal value (e.g., dollars)
  const decimalValue = baseValue / Math.pow(10, currency.decimalPlaces)

  // Format with the correct number of decimal places
  return decimalValue.toFixed(currency.decimalPlaces)
}
