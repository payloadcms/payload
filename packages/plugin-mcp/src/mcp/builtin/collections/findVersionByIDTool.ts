import { getPayloadOperation, invokeOperation, type PopulateType, type SelectType } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const findVersionByIDOperation = getPayloadOperation('collection', 'findVersionByID')

const DEFAULT_DESCRIPTION =
  'Find a specific document version in any version-enabled collection by passing the collection slug and version ID.'

export const findVersionByIDTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) &&
    Boolean(args.permissions?.collections?.[args.collectionSlug]?.readVersions),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Version By ID',
  },
  description: DEFAULT_DESCRIPTION,
  input: findVersionByIDOperation.input.omit({ collection: true }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { id, depth, fallbackLocale, locale, populate, select, showHiddenFields, trash } = input

  logger.info(`Finding version in collection: ${collectionSlug} with ID: ${id}`)

  try {
    const result = await invokeOperation(findVersionByIDOperation, {
      context: payload,
      input: {
        id,
        collection: collectionSlug,
        depth,
        overrideAccess: authorizedMCP.overrideAccess,
        req,
        ...(fallbackLocale ? { fallbackLocale } : {}),
        ...(locale ? { locale } : {}),
        ...(populate ? { populate: populate as PopulateType } : {}),
        ...(select ? { select: select as SelectType } : {}),
        ...(showHiddenFields !== undefined ? { showHiddenFields } : {}),
        ...(trash !== undefined ? { trash } : {}),
      },
    })

    return {
      content: [
        {
          type: 'text',
          text: `Version "${id}" from collection "${collectionSlug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error finding version ${id} in ${collectionSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error finding version "${id}" in collection "${collectionSlug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
