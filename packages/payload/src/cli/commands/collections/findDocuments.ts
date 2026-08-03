import type { CLICommand } from '../../../config/types.js'
import type { Where } from '../../../index.js'

import { createDataCommand } from '../data/createDataCommand.js'
import {
  collectionSlugOption,
  defaultLimitOption,
  defaultPageOption,
  draftOption,
  joinsOption,
  optionalIDOption,
  paginationOption,
  readOptions,
  sortOption,
  trashOption,
  whereOption,
} from '../data/options.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindDocumentsCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'findDocuments',
      description: 'Find documents in a local collection, or find one document by ID.',
      async handler({ options, payload }) {
        const collection = options.slug
        const commonOptions = getReadOptions(options)
        const result =
          options.id !== undefined
            ? await payload.findByID({
                id: options.id,
                collection,
                ...commonOptions,
                draft: options.draft,
                joins: options.joins,
                trash: options.trash,
              })
            : await payload.find({
                collection,
                ...commonOptions,
                draft: options.draft,
                joins: options.joins,
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
        id: optionalIDOption,
        slug: collectionSlugOption,
        draft: draftOption,
        joins: joinsOption,
        limit: defaultLimitOption,
        page: defaultPageOption,
        pagination: paginationOption,
        sort: sortOption,
        trash: trashOption,
        where: whereOption,
      },
      summary: 'Find collection documents',
    },
  })
