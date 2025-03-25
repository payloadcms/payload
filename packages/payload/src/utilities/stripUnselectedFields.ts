import type { Data } from '../admin/types.js'
import type { Field, TabAsField } from '../fields/config/types.js'
import type { SelectMode, SelectType } from '../types/index.js'

import { fieldAffectsData } from '../fields/config/types.js'

/**
 * This is used for the Select API to strip out fields that are not selected.
 * It will mutate the given data object and determine if your recursive function should continue to run.
 * It is used within the `afterRead` hook as well as `getFormState`.
 * @returns boolean - whether or not the recursive function should continue
 */
export const stripUnselectedFields = ({
  field,
  select,
  selectMode,
  siblingDoc,
}: {
  field: Field | TabAsField
  select: SelectType
  selectMode: SelectMode
  siblingDoc: Data
}): boolean => {
  let shouldContinue = true

  if (fieldAffectsData(field) && select && selectMode && field.name) {
    if (selectMode === 'include') {
      if (!select[field.name]) {
        delete siblingDoc[field.name]
        shouldContinue = false
      }
    }

    if (selectMode === 'exclude') {
      if (select[field.name] === false) {
        delete siblingDoc[field.name]
        shouldContinue = false
      }
    }
  }

  return shouldContinue
}
