import { restoreGlobalVersionLocalInputSchema } from '../../../globals/operations/inputSchemas.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { parseBoolean, parseFallbackLocale, parseJSON } from '../data/input.js'
import { getReadOptions, printJSON } from '../data/utilities.js'

export const createRestoreGlobalVersionCommand = defineCLICommand({
  cli: {
    id: { flags: '--id <id>' },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
  },
  description: 'Restore one version of a local global.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const result = await payload.restoreGlobalVersion({
      id: String(args.id),
      slug: args.slug,
      ...getReadOptions(args),
    })

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: restoreGlobalVersionLocalInputSchema,
})
