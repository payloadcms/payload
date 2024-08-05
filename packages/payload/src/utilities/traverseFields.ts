import type { ClientFieldConfig } from '../fields/config/client.js'
import type { Field } from '../fields/config/types.js'

import { fieldHasSubFields } from '../fields/config/types.js'

type Ref = {
  [key: string]: Ref
}

/**
 * Iterate a recurse an array of fields, calling a callback for each field
 *
 * @param fields
 * @param callback callback called for each field
 * @param ref
 * @param parentRef
 */
export const traverseFields = (
  fields: (ClientFieldConfig | Field)[],
  callback?: (field: ClientFieldConfig | Field, ref: Ref, parentRef: Ref) => void,
  ref: Ref = {},
  parentRef: Ref = {},
): void => {
  fields.forEach((field) => {
    if (fieldHasSubFields(field)) {
      const parentRef = ref
      if ('name' in field && field.name) {
        ref[field.name] = {}
        ref = ref[field.name]
      }
      if (callback) callback(field, ref, parentRef)
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
    callback(field, ref, parentRef)
  })
}
