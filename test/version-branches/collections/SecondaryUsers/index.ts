import type { CollectionConfig, DatabaseAdapter } from 'payload'

import { secondaryUsersSlug } from '../../slugs.js'

export const buildSecondaryUsers = ({
  idType,
}: {
  idType: DatabaseAdapter['defaultIDType']
}): CollectionConfig => ({
  slug: secondaryUsersSlug,
  auth: true,
  fields: [{ name: 'id', type: idType }],
})
