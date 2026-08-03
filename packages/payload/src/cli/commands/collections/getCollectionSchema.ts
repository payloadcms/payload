import type { CLICommand } from '../../../config/types.js'

import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { getCollectionInputSchema } from '../../../utilities/entityInputSchema/getEntityInputSchema.js'
import { createDataCommand } from '../data/createDataCommand.js'
import { collectionSlugOption } from '../data/options.js'
import { printJSON } from '../data/utilities.js'

export const createGetCollectionSchemaCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'getCollectionSchema',
      description: 'Print the writable JSON schema for a local collection.',
      async handler({ options, payload }) {
        const collectionSlug = options.slug
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
        return {}
      },
      options: { slug: collectionSlugOption },
      summary: 'Print a collection input schema',
    },
  })
