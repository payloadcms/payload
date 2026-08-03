import type { CLICommand } from '../../../config/types.js'

import { createDataCommand } from '../data/createDataCommand.js'
import {
  collectionSlugOption,
  falseByDefaultDraftOption,
  idOption,
  readOptions,
} from '../data/options.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createRestoreVersionCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'restoreVersion',
      description: 'Restore one document version in a local collection.',
      async handler({ options, payload }) {
        const result = await payload.restoreVersion({
          id: String(options.id),
          collection: options.slug,
          ...getReadOptions(options),
          draft: options.draft,
        })

        printJSON(result)
        return {}
      },
      options: {
        ...readOptions,
        id: idOption,
        slug: collectionSlugOption,
        draft: falseByDefaultDraftOption,
      },
      summary: 'Restore a collection version',
    },
  })
