import type { CollectionConfig } from 'payload'

export const usersSlug = 'users'

export const UsersCollection: CollectionConfig = {
  slug: usersSlug,
  admin: { useAsTitle: 'email' },
  auth: { useAPIKey: true },
  fields: [],
}
