import type { FieldHook } from '../../../fields/config/types.js'

/** Keeps the authentication index out of returned documents. */
export const omitAPIKeyIndex: FieldHook = ({ siblingData }) => {
  delete siblingData.apiKeyIndex
}
