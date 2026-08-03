import type { CLICommand } from '../../../config/types.js'
import type { Where } from '../../../index.js'

import { createDataCommand } from '../data/createDataCommand.js'
import {
  defaultLimitOption,
  defaultPageOption,
  globalSlugOption,
  paginationOption,
  readOptions,
  sortOption,
  whereOption,
} from '../data/options.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindGlobalVersionsCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'findGlobalVersions',
      description: 'Find versions of a local global.',
      async handler({ options, payload }) {
        const result = await payload.findGlobalVersions({
          slug: options.slug,
          ...getReadOptions(options),
          limit: options.limit,
          page: options.page,
          pagination: options.pagination,
          sort: options.sort,
          where: options.where as undefined | Where,
        })

        printJSON(result)
        return {}
      },
      options: {
        ...readOptions,
        slug: globalSlugOption,
        limit: defaultLimitOption,
        page: defaultPageOption,
        pagination: paginationOption,
        sort: sortOption,
        where: whereOption,
      },
      summary: 'Find global versions',
    },
  })
