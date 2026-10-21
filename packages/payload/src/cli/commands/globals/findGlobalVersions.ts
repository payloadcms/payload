import { findGlobalVersionsLocalInputSchema } from '../../../globals/operations/inputSchemas.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { parseBoolean, parseFallbackLocale, parseJSON, parseSort } from '../data/input.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createFindGlobalVersionsCommand = defineCLICommand({
  cli: {
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
    sort: { flags: '--sort <field>', parse: parseSort },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Find versions of a local global.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const result = await payload.findGlobalVersions({
      slug: args.slug,
      ...getReadOptions(args),
      limit: args.limit,
      page: args.page,
      pagination: args.pagination,
      sort: args.sort,
      where: args.where,
    })

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: findGlobalVersionsLocalInputSchema,
})
