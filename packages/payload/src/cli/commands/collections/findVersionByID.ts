import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import {
  collectionSlugSchema,
  depthSchema,
  draftSchema,
  fallbackLocaleSchema,
  idSchema,
  localeSchema,
  parseFallbackLocale,
  parseID,
  parseJSON,
  populateSchema,
  selectSchema,
  showHiddenFieldsSchema,
  trashSchema,
} from '../data/input.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindVersionByIDCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>', parse: parseID },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
  },
  description: 'Find one document version in a local collection by ID.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const result = await payload.findVersionByID({
      id: String(args.id),
      collection: args.slug,
      ...getReadOptions(args),
      draft: args.draft,
      trash: args.trash,
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
    draft: draftSchema,
    fallbackLocale: fallbackLocaleSchema,
    locale: localeSchema,
    populate: populateSchema,
    select: selectSchema,
    showHiddenFields: showHiddenFieldsSchema,
    trash: trashSchema,
  }),
})
