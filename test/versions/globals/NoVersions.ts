import type { GlobalConfig } from 'payload'

import { noVersionsGlobalSlug } from '../slugs.js'

export const NoVersionsGlobal: GlobalConfig = {
  slug: noVersionsGlobalSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: false,
}

export default NoVersionsGlobal
