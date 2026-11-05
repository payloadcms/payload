import type { FieldHook } from '../../../fields/config/types.js'

/** Prevents the encrypted key from surviving field-level reads. */
export const omitEncryptedAPIKey: FieldHook = ({ siblingData }) => {
  delete siblingData.apiKey
}
