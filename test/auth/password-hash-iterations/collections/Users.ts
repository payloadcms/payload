import type { CollectionConfig } from 'payload'

import { passwordHashIterationsUsersSlug } from '../shared.js'

export const Users: CollectionConfig = {
  slug: passwordHashIterationsUsersSlug,
  auth: true,
  fields: [],
}
