import { currency } from '@/collections/Products/ui/Variants/VariantSelect/columns/PriceInput/utilities'

export const formatNumberToCurrency = (value: number): string => {
  if (!currency) {
    return value.toString()
  }

  // Convert from base value (e.g., cents) to decimal value (e.g., dollars)
  const decimalValue = value / Math.pow(10, currency.decimalPlaces)

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  }).format(decimalValue)
}
