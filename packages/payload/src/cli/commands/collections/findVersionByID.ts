import type { CLICommand } from '../../../config/types.js'

import { createDataCommand } from '../data/createDataCommand.js'
import {
  collectionSlugOption,
  draftOption,
  idOption,
  readOptions,
  trashOption,
} from '../data/options.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindVersionByIDCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'findVersionByID',
      description: 'Find one document version in a local collection by ID.',
      async handler({ options, payload }) {
        const result = await payload.findVersionByID({
          id: String(options.id),
          collection: options.slug,
          ...getReadOptions(options),
          draft: options.draft,
          trash: options.trash,
        })

        printJSON(result)
        return {}
      },
      options: {
        ...readOptions,
        id: idOption,
        slug: collectionSlugOption,
        draft: draftOption,
        trash: trashOption,
      },
      summary: 'Find a collection version by ID',
    },
  })
