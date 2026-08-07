import { z } from 'zod'

import { defineCLICommand } from '../../defineCLICommand.js'
import {
  depthSchema,
  fallbackLocaleSchema,
  globalSlugSchema,
  idSchema,
  localeSchema,
  parseFallbackLocale,
  parseID,
  parseJSON,
  populateSchema,
  selectSchema,
  showHiddenFieldsSchema,
} from '../data/input.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindGlobalVersionByIDCommand = defineCLICommand({
  name: 'findGlobalVersionByID',
  cli: {
    id: { flags: '--id <id>', parse: parseID },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
  },
  description: 'Find one version of a local global by ID.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()
    const result = await payload.findGlobalVersionByID({
      id: args.id,
      slug: args.slug,
      ...getReadOptions(args),
    })

    printJSON(result)
  },
  helpGroup: 'Data commands',
  input: z.strictObject({
    id: idSchema,
    slug: globalSlugSchema,
    depth: depthSchema,
    fallbackLocale: fallbackLocaleSchema,
    locale: localeSchema,
    populate: populateSchema,
    select: selectSchema,
    showHiddenFields: showHiddenFieldsSchema,
  }),
})
