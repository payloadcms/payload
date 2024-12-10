import type { NumberField } from '../../payload-types.js'

export const numberDoc: Partial<NumberField> = {
  number: 5,
  min: 15,
  max: 5,
  positiveNumber: 5,
  negativeNumber: -5,
  decimalMin: 1.25,
  decimalMax: 0.25,
  hasMany: [5, 10, 15],
  validatesHasMany: [5],
  localizedHasMany: [10],
  withMinRows: [5, 10],
}
