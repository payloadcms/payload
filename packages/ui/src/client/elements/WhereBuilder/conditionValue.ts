import type { UpdateCondition } from './types.js'

type UpdateType = Parameters<UpdateCondition>[0]['type']

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
