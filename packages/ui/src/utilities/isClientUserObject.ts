import type { User } from 'payload'

/** @internal */
export const isClientUserObject = (user): user is User => {
  return user && typeof user === 'object'
}
