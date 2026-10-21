import { deleteDocumentsLocalInputSchema } from '../../../collections/operations/inputSchemas.js'
import { parseDocumentID } from '../../../utilities/parseDocumentID.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { parseBoolean, parseFallbackLocale, parseJSON } from '../data/input.js'
import { printJSON } from '../data/utilities.js'

export const createDeleteDocumentsCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>' },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Delete documents from a local collection by ID or where query.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    let result

    if (args.id !== undefined) {
      result = await payload.delete({
        id: parseDocumentID({ id: args.id, collectionSlug: args.slug, payload }),
        collection: args.slug,
        depth: args.depth,
        fallbackLocale: args.fallbackLocale,
        locale: args.locale,
        overrideAccess: args.overrideAccess,
      })
    } else if (args.where !== undefined) {
      result = await payload.delete({
        collection: args.slug,
        depth: args.depth,
        fallbackLocale: args.fallbackLocale,
        locale: args.locale,
        overrideAccess: args.overrideAccess,
        where: args.where,
      })
    } else {
      throw new Error('Either id or where must be provided.')
    }

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: deleteDocumentsLocalInputSchema,
})
