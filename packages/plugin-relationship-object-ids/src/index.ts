import type { Config } from 'payload/config'

import { traverseFields } from './traverseFields.js'

export const relationshipsAsObjectIDPlugin =
  () =>
  (incomingConfig: Config): Config => {
    return {
      ...incomingConfig,
      collections: incomingConfig.collections?.map((collection) => ({
        ...collection,
        fields: traverseFields({ config: incomingConfig, fields: collection.fields }),
      })),
      globals: (incomingConfig.globals ?? []).map((global) => ({
        ...global,
        fields: traverseFields({ config: incomingConfig, fields: global.fields }),
      })),
    }
  }
