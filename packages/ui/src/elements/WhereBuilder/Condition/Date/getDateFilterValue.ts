import {
  classifyDateFilterInput,
  getDateOnlyValue,
  isDateOnlyFilter,
  isDateOnlyPickerAppearance,
  isValidDateFilterValue,
} from 'payload/shared'

import type { Value } from '../../types.js'

export const getDateFilterPickerValue = ({
  pickerAppearance = 'default',
  value,
}: {
  pickerAppearance?: string
  value: Date | string
}): Date | string => {
  if (!isDateOnlyPickerAppearance({ pickerAppearance }) || typeof value !== 'string') {
    return value
  }

  const dateOnlyValue = getDateOnlyValue({ value })

  if (!dateOnlyValue) {
    return value
  }

  const pickerDate = new Date(0)

  pickerDate.setFullYear(dateOnlyValue.year, dateOnlyValue.month - 1, dateOnlyValue.day)
  pickerDate.setHours(0, 0, 0, 0)

  return pickerDate
}

export const getDateFilterValue = ({
  date,
  operator,
  pickerAppearance = 'default',
}: {
  date: Date
  operator: string
  pickerAppearance?: string
}): Date | string =>
  isDateOnlyFilter({ operator, pickerAppearance }) ? date.toISOString().slice(0, 10) : date

export const getDateFilterOperatorValue = ({
  operator,
  pickerAppearance = 'default',
  value,
}: {
  operator: string
  pickerAppearance?: string
  value: Value
}): Value => {
  if (!isDateOnlyPickerAppearance({ pickerAppearance })) {
    return isDateOnlyFilter({ operator }) && !isValidDateFilterValue({ value }) ? undefined : value
  }

  if (isDateOnlyFilter({ operator, pickerAppearance })) {
    if (!isValidDateFilterValue({ value })) {
      return undefined
    }

    return classifyDateFilterInput({ operator, value }).kind === 'unsupported' ? undefined : value
  }

  return typeof value === 'string' && getDateOnlyValue({ value }) ? undefined : value
}

export const shouldSyncConditionValue = ({
  fieldPath,
  lastFieldPath,
  lastOperator,
  lastReportedValue,
  operator,
  value,
}: {
  fieldPath: string
  lastFieldPath: string
  lastOperator: string
  lastReportedValue: Value
  operator: string
  value: Value
}): boolean =>
  fieldPath !== lastFieldPath || operator !== lastOperator || value !== lastReportedValue
