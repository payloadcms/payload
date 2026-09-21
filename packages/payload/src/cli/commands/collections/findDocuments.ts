import { findDocumentsLocalInputSchema } from '../../../collections/operations/inputSchemas.js'
import { parseDocumentID } from '../../../utilities/parseDocumentID.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { parseBoolean, parseFallbackLocale, parseJSON, parseSort } from '../data/input.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindDocumentsCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>' },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    joins: { flags: '--joins <json|@file>', parse: parseJSON },
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
    sort: { flags: '--sort <field>', parse: parseSort },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Find documents in a local collection, or find one document by ID.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const collection = args.slug
    const commonOptions = getReadOptions(args)
    const result =
      args.id !== undefined
        ? await payload.findByID({
            id: parseDocumentID({ id: args.id, collectionSlug: collection, payload }),
            collection,
            ...commonOptions,
            draft: args.draft,
            joins: args.joins,
            trash: args.trash,
          })
        : await payload.find({
            collection,
            ...commonOptions,
            draft: args.draft,
            joins: args.joins,
            limit: args.limit,
            page: args.page,
            pagination: args.pagination,
            sort: args.sort,
            trash: args.trash,
            where: args.where,
          })

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: findDocumentsLocalInputSchema,
})
