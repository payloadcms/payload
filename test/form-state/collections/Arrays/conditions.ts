import type { Condition } from 'payload'

/**
 * Path-valued conditions are isomorphic — pure functions invoked both on the
 * server (during initial form-state build) and on the client (per keystroke
 * via the import registry). Don't add a `'use client'` directive: it would
 * make the module client-only and the server-side evaluation would throw
 * "Attempted to call X from the server but X is on the client".
 *
 * Falls back from `siblingData` to `data` so the same function works at the
 * top of the document (client passes `siblingData=undefined` for top-level
 * fields; server passes `siblingData=data`) and inside an array row
 * (siblingData is the row, data is the full doc).
 */
const checkboxIs = (key: string): Condition => {
  return (data, siblingData) => {
    const source = (siblingData ?? data) as Record<string, unknown> | undefined
    return Boolean(source?.[key])
  }
}

export const showDefault: Condition = checkboxIs('showDefault')
export const showClient: Condition = checkboxIs('showClient')
export const showServer: Condition = checkboxIs('showServer')
export const show: Condition = checkboxIs('show')
