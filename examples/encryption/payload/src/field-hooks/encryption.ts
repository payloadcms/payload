import type { FieldHook } from 'payload/types'

import { decrypt, encrypt } from '../utilities/crypto'

export const encryptField: FieldHook = ({ value }) => {
  if (typeof value === 'string') {
    return encrypt(value as string)
  }

  return undefined
}

export const decryptField: FieldHook = ({ value }) => {
  try {
    const decrypted = typeof value === 'string' ? decrypt(value as string) : value
    return decrypted
  } catch (e: unknown) {
    return undefined
  }
}
