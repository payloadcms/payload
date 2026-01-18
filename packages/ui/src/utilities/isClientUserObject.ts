import type { ClientUser } from 'payload'

export const isClientUserObject = (user): user is ClientUser => {
  return user && typeof user === 'object'
}
