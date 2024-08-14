import type { Field } from '../fields/config/types.js'

import { fieldHasSubFields } from '../fields/config/types.js'

type Ref = {
  [key: string]: Ref
}

/**
 * Iterate a recurse an array of fields, calling a callback for each field
 *
 * @param fields
 * @param callback callback called for each field, discontinue looping if callback returns truthy
 * @param ref
 * @param parentRef
 */
export const traverseFields = (
  fields: (Field)[],
  callback?: (field: Field, ref: Ref, parentRef: Ref) => boolean | void,
  ref: Ref = {},
  parentRef: Ref = {},
): void => {
  fields.some((field) => {
    if (fieldHasSubFields(field)) {
      const parentRef = ref
      if ('name' in field && field.name) {
        ref[field.name] = {}
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
