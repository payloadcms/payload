import { findDistinctLocalInputSchema } from '../../../collections/operations/inputSchemas.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { parseBoolean, parseJSON, parseSort } from '../data/input.js'
import { printJSON } from '../data/utilities.js'

export const createFindDistinctCommand = defineCLICommand({
  cli: {
    overrideAccess: { flags: '--override-access <true|false>', parse: parseBoolean },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    sort: { flags: '--sort <field>', parse: parseSort },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Find distinct field values in a local collection.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const result = await payload.findDistinct({
      collection: args.slug,
      depth: args.depth,
      field: args.field,
      limit: args.limit,
      locale: args.locale,
      overrideAccess: args.overrideAccess,
      page: args.page,
      populate: args.populate,
      showHiddenFields: args.showHiddenFields,
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
  input: findDistinctLocalInputSchema,
})
