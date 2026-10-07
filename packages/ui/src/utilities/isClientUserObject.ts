import type { User } from 'payload'

export const isClientUserObject = (user): user is User => {
  return user && typeof user === 'object'
}
