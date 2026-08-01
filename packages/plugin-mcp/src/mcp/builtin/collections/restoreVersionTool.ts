import { getPayloadOperation, invokeOperation, type PopulateType, type SelectType } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const restoreVersionOperation = getPayloadOperation('collection', 'restoreVersion')

const DEFAULT_DESCRIPTION =
  'Restore a document from a previous version in any version-enabled collection.'

export const restoreVersionTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.collectionSlug]?.update),
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Restore Version',
  },
  description: DEFAULT_DESCRIPTION,
  input: restoreVersionOperation.input.omit({ collection: true }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { id, depth, draft, fallbackLocale, locale, populate, select, showHiddenFields } = input

  logger.info(`Restoring version in collection: ${collectionSlug} with ID: ${id}`)

  try {
    const result = await invokeOperation(restoreVersionOperation, {
      context: payload,
      input: {
        id,
        collection: collectionSlug,
        depth,
        draft,
        overrideAccess: authorizedMCP.overrideAccess,
        req,
        ...(fallbackLocale ? { fallbackLocale } : {}),
        ...(locale ? { locale } : {}),
        ...(populate ? { populate: populate as PopulateType } : {}),
        ...(select ? { select: select as SelectType } : {}),
        ...(showHiddenFields !== undefined ? { showHiddenFields } : {}),
      },
    })

    return {
      content: [
        {
          type: 'text',
          text: `Version "${id}" restored successfully in collection "${collectionSlug}"!\nRestored document:\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error restoring version ${id} in ${collectionSlug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error restoring version "${id}" in collection "${collectionSlug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
