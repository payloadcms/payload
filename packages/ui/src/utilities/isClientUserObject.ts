import type { ClientUser } from '@ruya.sa/payload'

export const isClientUserObject = (user): user is ClientUser => {
  return user && typeof user === 'object'
}
