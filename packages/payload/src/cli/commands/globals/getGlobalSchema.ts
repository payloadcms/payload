import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { getGlobalInputSchema } from '../../../utilities/entityInputSchema/getEntityInputSchema.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import { globalSlugSchema } from '../data/input.js'
import { printJSON } from '../data/utilities.js'

export const createGetGlobalSchemaCommand = defineCLICommand({
  description: 'Print the writable JSON schema for a local global.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const globalSlug = args.slug
    const req = await createLocalReq({}, payload)
    const schema = getGlobalInputSchema({ globalSlug, req })

    if (!schema) {
      throw new Error(`Global "${globalSlug}" not found.`)
    }

    const result = { globalSlug, schema }

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: strictObject({
    slug: globalSlugSchema,
  }),
})
