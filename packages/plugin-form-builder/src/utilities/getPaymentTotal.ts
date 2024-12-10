import type { FieldValues, PaymentField, PriceCondition } from '../types.js'

export const getPaymentTotal = (
  args: {
    fieldValues: FieldValues
  } & Partial<PaymentField>,
): number => {
  const { basePrice = 0, fieldValues, priceConditions } = args

  let total = basePrice

  if (Array.isArray(priceConditions) && priceConditions.length > 0) {
    priceConditions.forEach((priceCondition: PriceCondition) => {
      const { condition, fieldToUse, operator, valueForCondition, valueForOperator, valueType } =
        priceCondition

      const valueOfField = fieldValues?.[fieldToUse]

      if (valueOfField) {
        if (
          condition === 'hasValue' ||
          (condition === 'equals' && valueOfField === valueForCondition) ||
          (condition === 'notEquals' && valueOfField !== valueForCondition)
        ) {
          const valueToUse = Number(valueType === 'valueOfField' ? valueOfField : valueForOperator)
          switch (operator) {
            case 'add': {
              total += valueToUse
              break
            }
            case 'divide': {
              total /= valueToUse
              break
            }
            case 'multiply': {
              total *= valueToUse
              break
            }
            case 'subtract': {
              total -= valueToUse
              break
            }
            default: {
              break
            }
          }
        }
      }
    })
  }

  return total
}
