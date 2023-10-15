import type { FieldValues, PaymentField, PriceCondition } from '../types'

export const getPaymentTotal = (
  args: Partial<PaymentField> & {
    fieldValues: FieldValues
  },
): number => {
  const { basePrice = 0, priceConditions, fieldValues } = args

  let total = basePrice

  if (Array.isArray(priceConditions) && priceConditions.length > 0) {
    priceConditions.forEach((priceCondition: PriceCondition) => {
      const { condition, valueForCondition, fieldToUse, operator, valueType, valueForOperator } =
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
            case 'subtract': {
              total -= valueToUse
              break
            }
            case 'multiply': {
              total *= valueToUse
              break
            }
            case 'divide': {
              total /= valueToUse
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
