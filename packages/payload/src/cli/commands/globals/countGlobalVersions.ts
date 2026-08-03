import type { CLICommand } from '../../../config/types.js'
import type { Where } from '../../../index.js'

import { createDataCommand } from '../data/createDataCommand.js'
import { globalSlugOption, localeOption, whereOption } from '../data/options.js'
import { printJSON } from '../data/utilities.js'

export const createCountGlobalVersionsCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'countGlobalVersions',
      description: 'Count versions of a local global.',
      async handler({ options, payload }) {
        const result = await payload.countGlobalVersions({
          global: options.slug,
          locale: options.locale,
          overrideAccess: true,
          where: options.where as undefined | Where,
        })

        printJSON(result)
        return {}
      },
      options: {
        slug: globalSlugOption,
        locale: localeOption,
        where: whereOption,
      },
      summary: 'Count global versions',
    },
  })
