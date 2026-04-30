import type { Condition } from 'payload'

/**
 * Path-valued conditions are isomorphic — pure functions invoked both on the
 * server (during initial form-state build) and on the client (per keystroke
 * via the import registry). Don't add a `'use client'` directive: it would
 * make the module client-only and the server-side evaluation would throw
 * "Attempted to call X from the server but X is on the client".
 */
export const showWhenChecked: Condition = (data) => {
  return Boolean((data as { showConditionalFields?: boolean })?.showConditionalFields)
}
