import { countGlobalVersionsLocalInputSchema } from '../../../globals/operations/inputSchemas.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { parseBoolean, parseJSON } from '../data/input.js'
import { printJSON } from '../data/utilities.js'

export const createCountGlobalVersionsCommand = defineCLICommand({
  cli: {
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Count versions of a local global.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const result = await payload.countGlobalVersions({
      global: args.slug,
      locale: args.locale,
      overrideAccess: args.overrideAccess,
      where: args.where,
    })

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: countGlobalVersionsLocalInputSchema,
})
