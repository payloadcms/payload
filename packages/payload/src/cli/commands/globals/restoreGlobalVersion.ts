import type { CLICommand } from '../../../config/types.js'

import { createDataCommand } from '../data/createDataCommand.js'
import { globalSlugOption, idOption, readOptions } from '../data/options.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createRestoreGlobalVersionCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'restoreGlobalVersion',
      description: 'Restore one version of a local global.',
      async handler({ options, payload }) {
        const result = await payload.restoreGlobalVersion({
          id: String(options.id),
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
      summary: 'Restore a global version',
    },
  })
