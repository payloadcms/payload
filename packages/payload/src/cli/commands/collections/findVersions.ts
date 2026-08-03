import type { CLICommand } from '../../../config/types.js'
import type { Where } from '../../../index.js'

import { createDataCommand } from '../data/createDataCommand.js'
import {
  collectionSlugOption,
  defaultLimitOption,
  defaultPageOption,
  draftOption,
  paginationOption,
  readOptions,
  sortOption,
  trashOption,
  whereOption,
} from '../data/options.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindVersionsCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'findVersions',
      description: 'Find document versions in a local collection.',
      async handler({ options, payload }) {
        const result = await payload.findVersions({
          collection: options.slug,
          ...getReadOptions(options),
          draft: options.draft,
          limit: options.limit,
          page: options.page,
          pagination: options.pagination,
          sort: options.sort,
          trash: options.trash,
          where: options.where as undefined | Where,
        })

        printJSON(result)
        return {}
      },
      options: {
        ...readOptions,
        slug: collectionSlugOption,
        draft: draftOption,
        limit: defaultLimitOption,
        page: defaultPageOption,
        pagination: paginationOption,
        sort: sortOption,
        trash: trashOption,
        where: whereOption,
      },
      summary: 'Find collection versions',
    },
  })
