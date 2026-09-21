import { getGlobalSchemaInputSchema } from '../../../globals/operations/inputSchemas.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { getGlobalInputSchema } from '../../../utilities/entityInputSchema/getEntityInputSchema.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { printJSON } from '../data/utilities.js'

export const createGetGlobalSchemaCommand = defineCLICommand({
  description: 'Print the writable JSON schema for a local global.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const slug = args.slug
    const req = await createLocalReq({}, payload)
    const schema = getGlobalInputSchema({ globalSlug: slug, req })

    if (!schema) {
      throw new Error(`Global "${slug}" not found.`)
    }

    const result = { slug, schema }

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: getGlobalSchemaInputSchema,
})
