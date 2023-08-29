import type { CollectionConfig } from '../collections/config/types.js'

import { extractTranslations } from '../translations/extractTranslations.js'

const labels = extractTranslations(['general:user', 'general:users'])

export const defaultUserCollection: CollectionConfig = {
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    tokenExpiration: 7200,
  },
  fields: [],
  labels: {
    plural: labels['general:users'],
    singular: labels['general:user'],
  },
  slug: 'users',
}
