import type { CLICommand } from '../../../config/types.js'

import { createDataCommand } from '../data/createDataCommand.js'
import { globalSlugOption, idOption, readOptions } from '../data/options.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindGlobalVersionByIDCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'findGlobalVersionByID',
      description: 'Find one version of a local global by ID.',
      async handler({ options, payload }) {
        const result = await payload.findGlobalVersionByID({
          id: options.id,
          slug: options.slug,
          ...getReadOptions(options),
        })

        printJSON(result)
        return {}
      },
      options: {
        ...readOptions,
        id: idOption,
        slug: globalSlugOption,
      },
      summary: 'Find a global version by ID',
    },
  })
