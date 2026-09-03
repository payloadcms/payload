import { getCollectionSchemaInputSchema } from '../../../collections/operations/inputSchemas.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { getCollectionInputSchema } from '../../../utilities/entityInputSchema/getEntityInputSchema.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { printJSON } from '../data/utilities.js'

export const createGetCollectionSchemaCommand = defineCLICommand({
  description: 'Print the writable JSON schema for a local collection.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const slug = args.slug
    const req = await createLocalReq({}, payload)
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

    const result = { slug, schema, upload }

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: getCollectionSchemaInputSchema,
})
