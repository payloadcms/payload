import type { Where } from '../../../index.js'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import {
  defaultLimitSchema,
  defaultPageSchema,
  depthSchema,
  fallbackLocaleSchema,
  globalSlugSchema,
  localeSchema,
  paginationSchema,
  parseFallbackLocale,
  parseJSON,
  parseSort,
  populateSchema,
  selectSchema,
  showHiddenFieldsSchema,
  sortSchema,
  whereSchema,
} from '../data/input.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindGlobalVersionsCommand = defineCLICommand({
  cli: {
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
    sort: { flags: '--sort <field>', parse: parseSort },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Find versions of a local global.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()
    const result = await payload.findGlobalVersions({
      slug: args.slug,
      ...getReadOptions(args),
      limit: args.limit,
      page: args.page,
      pagination: args.pagination,
      sort: args.sort,
      where: args.where as undefined | Where,
    })

    printJSON(result)
  },
  helpGroup: 'Data commands',
  input: strictObject({
    slug: globalSlugSchema,
    depth: depthSchema,
    fallbackLocale: fallbackLocaleSchema,
    limit: defaultLimitSchema,
    locale: localeSchema,
    page: defaultPageSchema,
    pagination: paginationSchema,
    populate: populateSchema,
    select: selectSchema,
    showHiddenFields: showHiddenFieldsSchema,
    sort: sortSchema,
    where: whereSchema,
  }),
})
