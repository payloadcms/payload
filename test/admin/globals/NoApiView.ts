import type { GlobalConfig } from 'payload'

import { noApiViewGlobalSlug } from '../slugs.js'

export const GlobalNoApiView: GlobalConfig = {
  slug: noApiViewGlobalSlug,
  admin: {
    hideAPIURL: true,
  },
  fields: [],
}
