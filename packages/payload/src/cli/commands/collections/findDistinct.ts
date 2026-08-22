import type { PopulateType, Where } from '../../../index.js'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import {
  collectionSlugSchema,
  depthSchema,
  fieldSchema,
  limitSchema,
  localeSchema,
  pageSchema,
  parseJSON,
  parseSort,
  populateSchema,
  showHiddenFieldsSchema,
  sortSchema,
  trashSchema,
  whereSchema,
} from '../data/input.js'
import { printJSON } from '../data/utilities.js'

export const createFindDistinctCommand = defineCLICommand({
  cli: {
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    sort: { flags: '--sort <field>', parse: parseSort },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Find distinct field values in a local collection.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const result = await payload.findDistinct({
      collection: args.slug,
      depth: args.depth,
      field: args.field,
      limit: args.limit,
      locale: args.locale,
      overrideAccess: true,
      page: args.page,
      populate: args.populate as PopulateType | undefined,
      showHiddenFields: args.showHiddenFields,
      sort: args.sort,
      trash: args.trash,
      where: args.where as undefined | Where,
    })

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: strictObject({
    slug: collectionSlugSchema,
    depth: depthSchema,
    field: fieldSchema,
    limit: limitSchema,
    locale: localeSchema,
    page: pageSchema,
    populate: populateSchema,
    showHiddenFields: showHiddenFieldsSchema,
    sort: sortSchema,
    trash: trashSchema,
    where: whereSchema,
  }),
})
