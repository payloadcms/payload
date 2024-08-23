import type { Field } from '../fields/config/types.js'

import { fieldHasSubFields } from '../fields/config/types.js'

/**
 * Iterate a recurse an array of fields, calling a callback for each field
 *
 * @param fields
 * @param callback callback called for each field, discontinue looping if callback returns truthy
 * @param ref
 * @param parentRef
 */
export const traverseFields = (
  fields: Field[],
  callback?: (
    field: Field,
    ref: Record<string, unknown> | unknown,
    parentRef: Record<string, unknown> | unknown,
  ) => boolean | void,
  ref: Record<string, unknown> | unknown = {},
  parentRef: Record<string, unknown> | unknown = {},
): void => {
  fields.some((field) => {
    if (fieldHasSubFields(field)) {
      const parentRef = ref
      if ('name' in field && field.name) {
        if (typeof ref[field.name] === 'undefined') ref[field.name] = {}
        ref = ref[field.name]
      }
      if (callback && callback(field, ref, parentRef)) {
        return true
      }
      traverseFields(field.fields, callback, ref, parentRef)
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      field.tabs.forEach((tab) => {
        if ('name' in tab && tab.name) {
          ref[tab.name] = {}
          ref = ref[tab.name]
        }
        traverseFields(tab.fields, callback, ref, parentRef)
      })
    }
    if (callback && callback(field, ref, parentRef)) {
      return true
    }
  })
}
