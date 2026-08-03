import type { CLICommand } from '../../../config/types.js'
import type { Where } from '../../../index.js'

import { createDataCommand } from '../data/createDataCommand.js'
import { collectionSlugOption, localeOption, trashOption, whereOption } from '../data/options.js'
import { printJSON } from '../data/utilities.js'

export const createCountDocumentsCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'countDocuments',
      description: 'Count documents in a local collection.',
      async handler({ options, payload }) {
        const result = await payload.count({
          collection: options.slug,
          locale: options.locale,
          overrideAccess: true,
          trash: options.trash,
          where: options.where as undefined | Where,
        })

        printJSON(result)
        return {}
      },
      options: {
        slug: collectionSlugOption,
        locale: localeOption,
        trash: trashOption,
        where: whereOption,
      },
      summary: 'Count collection documents',
    },
  })
