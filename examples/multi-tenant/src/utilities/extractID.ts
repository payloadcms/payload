import { Config } from '@/payload-types'
import type { CollectionSlug } from 'payload'

/**
 * Use the passed ID or the value of the `.id` property in case of an object
 * @template T The object or ID value type
 * @param {T} objectOrID The object or ID
 * @returns The ID
 */
export const extractID = <T extends Config['collections'][CollectionSlug]>(
  objectOrID: T | T['id'],
): T['id'] => {
  if (objectOrID && typeof objectOrID === 'object') return objectOrID.id

  return objectOrID
}
