import { getCollectionSchemaInputSchema } from '../../../collections/operations/inputSchemas.js'
import { getLLMInstructions } from '../../../llm-instructions/getInstructions.js'
import { createPayloadRequest } from '../../../utilities/createPayloadRequest.js'
import { getCollectionInputSchema } from '../../../utilities/entityInputSchema/getEntityInputSchema.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { printJSON } from '../data/utilities.js'

export const createGetCollectionSchemaCommand = defineCLICommand({
  description: 'Print the writable JSON schema and LLM instructions for a local collection.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const slug = args.slug
    const req = await createPayloadRequest({ payload })
    const schema = getCollectionInputSchema({ collectionSlug: slug, req })

    if (!schema) {
      throw new Error(`Collection "${slug}" not found.`)
    }

    const uploadConfig = payload.collections[slug]?.config.upload
    const maxFileSize = payload.config.upload.limits?.fileSize
    const upload = uploadConfig
      ? {
          enabled: true,
          filesRequiredOnCreate: uploadConfig.filesRequiredOnCreate !== false,
          mimeTypes: uploadConfig.mimeTypes ?? ['*/*'],
          ...(typeof maxFileSize === 'number' && Number.isFinite(maxFileSize)
            ? { maxFileSize }
            : {}),
        }
      : { enabled: false }

    const instructions = getLLMInstructions({
      slug,
      type: 'collection',
      req,
    })
    const result = { slug, schema, upload, ...(instructions ? { instructions } : {}) }

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: getCollectionSchemaInputSchema,
})
