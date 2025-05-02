import type { CollectionConfig } from 'payload'

import { usersSlug } from '../shared.js'

export const Users: CollectionConfig = {
  slug: usersSlug,
  auth: true,
  fields: [],
}
