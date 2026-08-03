import type { CLICommand } from '../../../config/types.js'
import type { PopulateType, Where } from '../../../index.js'

import { createDataCommand } from '../data/createDataCommand.js'
import {
  collectionSlugOption,
  depthOption,
  fieldOption,
  localeOption,
  optionalLimitOption,
  optionalPageOption,
  populateOption,
  showHiddenFieldsOption,
  sortOption,
  trashOption,
  whereOption,
} from '../data/options.js'
import { printJSON } from '../data/utilities.js'

export const createFindDistinctCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'findDistinct',
      description: 'Find distinct field values in a local collection.',
      async handler({ options, payload }) {
        const result = await payload.findDistinct({
          collection: options.slug,
          depth: options.depth,
          field: options.field,
          limit: options.limit,
          locale: options.locale,
          overrideAccess: true,
          page: options.page,
          populate: options.populate as PopulateType | undefined,
          showHiddenFields: options.showHiddenFields,
          sort: options.sort,
          trash: options.trash,
          where: options.where as undefined | Where,
        })

        printJSON(result)
        return {}
      },
      options: {
        slug: collectionSlugOption,
        depth: depthOption,
        field: fieldOption,
        limit: optionalLimitOption,
        locale: localeOption,
        page: optionalPageOption,
        populate: populateOption,
        showHiddenFields: showHiddenFieldsOption,
        sort: sortOption,
        trash: trashOption,
        where: whereOption,
      },
      summary: 'Find distinct collection values',
    },
  })
