import { z } from 'zod'

import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { getCollectionInputSchema } from '../../../utilities/entityInputSchema/getEntityInputSchema.js'
import { defineCLICommand } from '../../defineCLICommand.js'
import { collectionSlugSchema } from '../data/input.js'
import { printJSON } from '../data/utilities.js'

export const createGetCollectionSchemaCommand = defineCLICommand({
  name: 'getCollectionSchema',
  description: 'Print the writable JSON schema for a local collection.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()
    const collectionSlug = args.slug
    const req = await createLocalReq({}, payload)
    const schema = getCollectionInputSchema({ collectionSlug, req })

    if (!schema) {
      throw new Error(`Collection "${collectionSlug}" not found.`)
    }

    const uploadConfig = payload.collections[collectionSlug]?.config.upload
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

    printJSON({ collectionSlug, schema, upload })
  },
  helpGroup: 'Data commands',
  input: z.strictObject({
    slug: collectionSlugSchema,
  }),
})
