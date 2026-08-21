import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
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
  cli: {
    id: { flags: '--id <id>', parse: parseID },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
  },
  description: 'Find one version of a local global by ID.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const result = await payload.findGlobalVersionByID({
      id: args.id,
      slug: args.slug,
      ...getReadOptions(args),
    })

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: strictObject({
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
