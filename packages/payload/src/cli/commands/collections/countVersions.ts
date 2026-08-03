import type { CLICommand } from '../../../config/types.js'
import type { Where } from '../../../index.js'

import { createDataCommand } from '../data/createDataCommand.js'
import { collectionSlugOption, localeOption, whereOption } from '../data/options.js'
import { printJSON } from '../data/utilities.js'

export const createCountVersionsCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'countVersions',
      description: 'Count document versions in a local collection.',
      async handler({ options, payload }) {
        const result = await payload.countVersions({
          collection: options.slug,
          locale: options.locale,
          overrideAccess: true,
          where: options.where as undefined | Where,
        })

        printJSON(result)
        return {}
      },
      options: {
        slug: collectionSlugOption,
        locale: localeOption,
        where: whereOption,
      },
      summary: 'Count collection versions',
    },
  })
