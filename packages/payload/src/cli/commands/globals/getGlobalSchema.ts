import { getGlobalSchemaInputSchema } from '../../../globals/operations/inputSchemas.js'
import { getLLMInstructions } from '../../../llm-instructions/getInstructions.js'
import { createPayloadRequest } from '../../../utilities/createPayloadRequest.js'
import { getGlobalInputSchema } from '../../../utilities/entityInputSchema/getEntityInputSchema.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { printJSON } from '../data/utilities.js'

export const createGetGlobalSchemaCommand = defineCLICommand({
  description: 'Print the writable JSON schema and LLM instructions for a local global.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const slug = args.slug
    const req = await createPayloadRequest({ payload })
    const schema = getGlobalInputSchema({ globalSlug: slug, req })

    if (!schema) {
      throw new Error(`Global "${slug}" not found.`)
    }

    const instructions = await getLLMInstructions({
      slug,
      type: 'global',
      overrideAccess: true,
      req,
    })
    const result = { slug, schema, ...(instructions ? { instructions } : {}) }

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: getGlobalSchemaInputSchema,
})
