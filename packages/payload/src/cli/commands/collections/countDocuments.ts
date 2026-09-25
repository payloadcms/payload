import { countDocumentsLocalInputSchema } from '../../../collections/operations/inputSchemas.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { parseBoolean, parseJSON } from '../data/input.js'
import { printJSON } from '../data/utilities.js'

export const createCountDocumentsCommand = defineCLICommand({
  cli: {
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Count documents in a local collection.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const result = await payload.count({
      collection: args.slug,
      locale: args.locale,
      overrideAccess: args.overrideAccess,
      trash: args.trash,
      where: args.where,
    })

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: countDocumentsLocalInputSchema,
})
