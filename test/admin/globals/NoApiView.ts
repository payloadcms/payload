import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types.js'

import { noApiViewGlobalSlug } from '../slugs.js'

export const GlobalNoApiView: GlobalConfig = {
  slug: noApiViewGlobalSlug,
  admin: {
    hideAPIURL: true,
  },
  fields: [],
}
