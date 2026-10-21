import type { Destroy } from 'payload'

import { destroy as destroyDrizzle } from '@payloadcms/drizzle'

import type { SQLiteAdapter } from './types.js'

import { retireReadConnections } from './readConnection.js'

export const destroy: Destroy = async function destroy(this: SQLiteAdapter) {
  let primaryError: unknown
  let hasFailed = false

  try {
    retireReadConnections({ adapter: this })
  } catch (error) {
    hasFailed = true
    primaryError = error
  }
  try {
    await destroyDrizzle.call(this)
  } catch (error) {
    if (!hasFailed) {
      throw error
    }
  }
  if (hasFailed) {
    throw primaryError
  }
}
