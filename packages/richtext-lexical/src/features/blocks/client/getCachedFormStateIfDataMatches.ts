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

const withoutSystemBlockFields = ({
  blockName: _blockName,
  blockType: _blockType,
  ...data
}: Data): Data => data
