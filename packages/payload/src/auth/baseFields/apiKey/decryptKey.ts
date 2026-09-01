import type { FieldHook } from '../../../fields/config/types.js'

/** Decrypts an API key for authorized reads and masks keys encrypted with an unavailable secret. */
export const decryptKey: FieldHook = ({ req, value }) => {
  if (!value) {
    return undefined
  }
  try {
    return req.payload.decrypt(value as string)
  } catch {
    // The value was encrypted under a secret no longer in the keyring (e.g. a
    // previousSecret was removed before rotateSecret re-keyed this row). Mask the
    // field (return null, since an undefined afterRead result is treated as "no
    // change" and would leak the ciphertext) rather than failing the whole
    // document read; API key auth is unaffected (it matches the apiKeyIndex), and
    // running rotateSecret restores the displayed value.
    return null
  }
}
