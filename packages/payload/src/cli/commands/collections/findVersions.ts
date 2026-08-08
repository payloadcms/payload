import type { Where } from '../../../index.js'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import {
  collectionSlugSchema,
  defaultLimitSchema,
  defaultPageSchema,
  depthSchema,
  draftSchema,
  fallbackLocaleSchema,
  localeSchema,
  paginationSchema,
  parseFallbackLocale,
  parseJSON,
  parseSort,
  populateSchema,
  selectSchema,
  showHiddenFieldsSchema,
  sortSchema,
  trashSchema,
  whereSchema,
} from '../data/input.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindVersionsCommand = defineCLICommand({
  cli: {
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
    sort: { flags: '--sort <field>', parse: parseSort },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Find document versions in a local collection.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()
    const result = await payload.findVersions({
      collection: args.slug,
      ...getReadOptions(args),
      draft: args.draft,
      limit: args.limit,
      page: args.page,
      pagination: args.pagination,
      sort: args.sort,
      trash: args.trash,
      where: args.where as undefined | Where,
    })

    printJSON(result)
  },
  helpGroup: 'Data commands',
  input: strictObject({
    slug: collectionSlugSchema,
    depth: depthSchema,
    draft: draftSchema,
    fallbackLocale: fallbackLocaleSchema,
    limit: defaultLimitSchema,
    locale: localeSchema,
    page: defaultPageSchema,
    pagination: paginationSchema,
    populate: populateSchema,
    select: selectSchema,
    showHiddenFields: showHiddenFieldsSchema,
    sort: sortSchema,
    trash: trashSchema,
    where: whereSchema,
  }),
})
