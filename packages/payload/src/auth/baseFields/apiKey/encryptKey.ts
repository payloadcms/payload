import type { FieldHook } from '../../../fields/config/types.js'

/** Encrypts an API key before it is persisted. */
export const encryptKey: FieldHook = ({ req, value }) =>
  value ? req.payload.encrypt(value as string) : null
