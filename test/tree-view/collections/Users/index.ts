import type { CollectionConfig } from 'payload'

import { slugs } from '../../shared.js'

export const UsersCollection: CollectionConfig = {
  slug: slugs.users,
  trash: true,
  auth: true,
  fields: [],
}
