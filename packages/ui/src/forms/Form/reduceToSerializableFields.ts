import type { FormState, FormStateWithoutComponents } from 'payload'

import { deepCopyObjectSimpleWithoutReactComponents } from 'payload/shared'

/**
 * Takes in FormState and returns a JSON-serializable copy of it.
 *
 * Form state carries React nodes at two depths — `field.customComponents` and
 * `field.rows[i].customComponents` — and a rendered component holds references back
 * into the running Payload instance through its server props, which makes the state
 * impossible to `JSON.stringify`. A populated relationship is not required: any row
 * whose field or block declares a row label carries one.
 *
 * This defers to `deepCopyObjectSimpleWithoutReactComponents` — the same helper
 * `Form/index.tsx` uses before sending form state to the server — which prunes
 * every React element by its `$$typeof` symbol at any depth (so both the
 * field-level and row-level component trees are removed), preserves the plain
 * data (values, row metadata, filter options, dates, ObjectIds), and drops
 * `File` values that cannot be serialized.
 */
export const reduceToSerializableFields = (fields: FormState): FormStateWithoutComponents =>
  deepCopyObjectSimpleWithoutReactComponents(fields, { excludeFiles: true })
