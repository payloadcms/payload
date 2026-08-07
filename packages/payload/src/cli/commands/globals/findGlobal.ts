import { z } from 'zod'

import { defineCLICommand } from '../../defineCLICommand.js'
import {
  depthSchema,
  fallbackLocaleSchema,
  globalSlugSchema,
  localeSchema,
  parseFallbackLocale,
  parseJSON,
  populateSchema,
  selectSchema,
  showHiddenFieldsSchema,
} from '../data/input.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindGlobalCommand = defineCLICommand({
  name: 'findGlobal',
  cli: {
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
  },
  description: 'Find a local global.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()
    const result = await payload.findGlobal({
      slug: args.slug,
      ...getReadOptions(args),
    })

    printJSON(result)
  },
  helpGroup: 'Data commands',
  input: z.strictObject({
    slug: globalSlugSchema,
    depth: depthSchema,
    fallbackLocale: fallbackLocaleSchema,
    locale: localeSchema,
    populate: populateSchema,
    select: selectSchema,
    showHiddenFields: showHiddenFieldsSchema,
  }),
})
