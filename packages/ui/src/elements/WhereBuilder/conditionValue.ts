import type { UpdateCondition } from './types.js'

type UpdateType = Parameters<UpdateCondition>[0]['type']

/**
 * A condition value that means "this row has no value yet". The same emptiness reaches the
 * where builder in three spellings: `''` from a query string such as `?where[or][0][and][0]
 * [title][equals]=`, `null` from a cleared ReactSelect, and `undefined` from a row that was
 * added but never filled in.
 */
export const isEmptyConditionValue = (value: unknown): boolean =>
  value === undefined || value === null || value === ''

/**
 * Whether a condition edit leaves the row exactly as it was, and so must not be committed.
 *
 * A row is rendered with its value coerced to `undefined` when it is empty, so a row loaded
 * from the URL holding `''` reports `undefined` back up as soon as it mounts. Committing that
 * stores `{ [operator]: undefined }`, which `qs.stringify` omits when the list view writes the
 * query back to the URL — so the condition serializes to nothing, the surrounding array closes
 * the gap, and the row disappears on the next parse.
 *
 * Only value edits are covered. A field or operator edit changes the row even while it holds
 * no value, so those must always be committed.
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
  type === 'value' && isEmptyConditionValue(storedValue) && isEmptyConditionValue(incomingValue)
