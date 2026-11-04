import {
  classifyDateFilterInput,
  getDateOnlyValue,
  isDateOnlyFilter,
  isDateOnlyPickerAppearance,
  isValidDateFilterValue,
} from 'payload/shared'

import type { UpdateCondition, Value } from './types.js'

type UpdateType = Parameters<UpdateCondition>[0]['type']

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

export const getDateFilterPickerValue = ({
  pickerAppearance = 'default',
  value,
}: {
  pickerAppearance?: string
  value: Date | string
}): Date | string => {
  if (!isDateOnlyPickerAppearance({ pickerAppearance })) {
    return value
  }

  if (typeof value !== 'string') {
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

/**
 * A row that holds no value yet. Empty arrives as `''` from the URL, `null` from a cleared
 * select, or `undefined` from a row that was added but never filled in.
 */
export const isEmptyConditionValue = ({ value }: { value: unknown }): boolean =>
  value === undefined || value === null || value === ''

/**
 * The value a row renders with. Only a missing value becomes `undefined`. `0` and `false` are
 * real filter values, so they must survive.
 */
export const getDisplayedConditionValue = <T>({ value }: { value: T }): T | undefined =>
  value ?? undefined

/**
 * Whether an edit leaves the row unchanged, and so must not be committed.
 *
 * An empty row renders blank and reports `undefined` back up as soon as it mounts. Committing
 * that stores `{ [operator]: undefined }`, which `qs.stringify` drops when the query is written
 * to the URL — so the row is gone on the next parse.
 *
 * Field and operator edits change the row even while it holds no value, so they always commit.
 */
export const isNoOpConditionValueUpdate = ({
  type,
  incomingValue,
  storedValue,
}: {
  incomingValue: unknown
  storedValue: unknown
  type: UpdateType
}): boolean =>
  type === 'value' &&
  isEmptyConditionValue({ value: storedValue }) &&
  isEmptyConditionValue({ value: incomingValue })
