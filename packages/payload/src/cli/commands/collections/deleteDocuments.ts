import type { CLICommand } from '../../../config/types.js'
import type { Payload, Where } from '../../../index.js'

import { createDataCommand } from '../data/createDataCommand.js'
import {
  collectionSlugOption,
  depthOption,
  fallbackLocaleOption,
  localeOption,
  optionalIDOption,
  whereOption,
} from '../data/options.js'
import { printJSON, requireIDOrWhere } from '../data/utilities.js'

export const createDeleteDocumentsCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'deleteDocuments',
      description: 'Delete documents from a local collection by ID or where query.',
      async handler({ options, payload }) {
        const result = await payload.delete({
          id: options.id,
          collection: options.slug,
          depth: options.depth,
          fallbackLocale: options.fallbackLocale,
          locale: options.locale,
          overrideAccess: true,
          where: options.where as undefined | Where,
        } as Parameters<Payload['delete']>[0])

        printJSON(result)
        return {}
      },
      options: {
        id: optionalIDOption,
        slug: collectionSlugOption,
        depth: depthOption,
        fallbackLocale: fallbackLocaleOption,
        locale: localeOption,
        where: whereOption,
      },
      summary: 'Delete collection documents',
      superRefine: requireIDOrWhere,
    },
  })
