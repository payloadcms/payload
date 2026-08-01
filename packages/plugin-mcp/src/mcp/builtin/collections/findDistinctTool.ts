import { getPayloadOperation, invokeOperation, type PopulateType } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const findDistinctOperation = getPayloadOperation('collection', 'findDistinct')

const DEFAULT_DESCRIPTION =
  'Find distinct values for a field in any collection by passing the collection slug and field path.'

export const findDistinctTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.collectionSlug]?.read),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Distinct',
  },
  description: DEFAULT_DESCRIPTION,
  input: findDistinctOperation.input.omit({ collection: true }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { depth, field, limit, locale, page, populate, showHiddenFields, sort, trash, where } =
    input

  logger.info(`Finding distinct values in collection: ${collectionSlug}, field: ${field}`)

  try {
    const result = await invokeOperation(findDistinctOperation, {
      context: payload,
      input: {
        collection: collectionSlug,
        depth,
        field,
        overrideAccess: authorizedMCP.overrideAccess,
        req,
        ...(limit ? { limit } : {}),
        ...(locale ? { locale } : {}),
        ...(page ? { page } : {}),
        ...(populate ? { populate: populate as PopulateType } : {}),
        ...(showHiddenFields !== undefined ? { showHiddenFields } : {}),
        ...(sort ? { sort } : {}),
        ...(trash !== undefined ? { trash } : {}),
        ...(where ? { where } : {}),
      },
    })

    return {
      content: [
        {
          type: 'text',
          text: `Distinct values for "${field}" in collection "${collectionSlug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error finding distinct values in ${collectionSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error finding distinct values in collection "${collectionSlug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
