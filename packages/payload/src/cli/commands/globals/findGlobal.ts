import type { CLICommand } from '../../../config/types.js'

import { createDataCommand } from '../data/createDataCommand.js'
import { globalSlugOption, readOptions } from '../data/options.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindGlobalCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'findGlobal',
      description: 'Find a local global.',
      async handler({ options, payload }) {
        const result = await payload.findGlobal({
          slug: options.slug,
          ...getReadOptions(options),
        })

        printJSON(result)
        return {}
      },
      options: {
        ...readOptions,
        slug: globalSlugOption,
      },
      summary: 'Find a global',
    },
  })
