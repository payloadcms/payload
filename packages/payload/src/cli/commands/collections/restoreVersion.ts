import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import {
  collectionSlugSchema,
  depthSchema,
  fallbackLocaleSchema,
  idSchema,
  localeSchema,
  parseFallbackLocale,
  parseID,
  parseJSON,
  populateSchema,
  selectSchema,
  showHiddenFieldsSchema,
  writeDraftSchema,
} from '../data/input.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createRestoreVersionCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>', parse: parseID },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
  },
  description: 'Restore one document version in a local collection.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const result = await payload.restoreVersion({
      id: String(args.id),
      collection: args.slug,
      ...getReadOptions(args),
      draft: args.draft,
    })

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: strictObject({
    id: idSchema,
    slug: collectionSlugSchema,
    depth: depthSchema,
    draft: writeDraftSchema,
    fallbackLocale: fallbackLocaleSchema,
    locale: localeSchema,
    populate: populateSchema,
    select: selectSchema,
    showHiddenFields: showHiddenFieldsSchema,
  }),
})
