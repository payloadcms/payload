import type { CollectionConfig } from '../collections/config/types.js'

export const defaultUserCollection: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    tokenExpiration: 7200,
  },
  fields: [],
  labels: {
    plural: ({ t }) => t('general:users'),
    singular: ({ t }) => t('general:user'),
  },
}
