import type { Data, FormState } from 'payload'

import { dequal } from 'dequal/lite'
import { reduceFieldsToValues } from 'payload/shared'

export const getCachedFormStateIfDataMatches = ({
  cachedFormState,
  formData,
}: {
  cachedFormState: FormState
  formData: Data
}): false | FormState => {
  const cachedData = reduceFieldsToValues(cachedFormState, true)

  return dequal(withoutSystemBlockFields(cachedData), withoutSystemBlockFields(formData))
    ? cachedFormState
    : false
}

/**
 * `blockType` is node metadata rather than a rendered block field. Regular blocks also manage
 * `blockName` separately so the current value can be added after a cached state is reused.
 */
const withoutSystemBlockFields = ({
  blockName: _blockName,
  blockType: _blockType,
  ...data
}: Data): Data => data
