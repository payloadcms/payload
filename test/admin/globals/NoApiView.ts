import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'
import { noApiViewGlobal } from '../shared'

export const GlobalNoApiView: GlobalConfig = {
  slug: noApiViewGlobal,
  admin: {
    hideAPIURL: true,
  },
  fields: [],
}
