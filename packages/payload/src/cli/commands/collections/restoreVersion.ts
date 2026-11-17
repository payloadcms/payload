import { restoreVersionLocalInputSchema } from '../../../collections/operations/inputSchemas.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { parseBoolean, parseFallbackLocale, parseJSON } from '../data/input.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createRestoreVersionCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>' },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
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
  input: restoreVersionLocalInputSchema,
})
