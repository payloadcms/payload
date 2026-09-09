import { findDistinctInputSchema } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'

const DEFAULT_DESCRIPTION =
  'Find distinct values for a field in any collection by passing the collection slug and field path.'

export const findDistinctTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.slug]?.read),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Find Distinct',
  },
  description: DEFAULT_DESCRIPTION,
  input: findDistinctInputSchema,
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { depth, field, limit, locale, page, populate, sort, trash, where } = input

  logger.info(`Finding distinct values in collection: ${slug}, field: ${field}`)

  try {
    const result = await payload.findDistinct({
      collection: slug,
      depth,
      field,
      overrideAccess: authorizedMCP.overrideAccess,
      req,
      ...(limit ? { limit } : {}),
      ...(locale ? { locale } : {}),
      ...(page ? { page } : {}),
      ...(populate ? { populate } : {}),
      ...(sort ? { sort } : {}),
      ...(trash !== undefined ? { trash } : {}),
      ...(where ? { where } : {}),
    })

    return {
      content: [
        {
          type: 'text',
          text: `Distinct values for "${field}" in collection "${slug}":\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error finding distinct values in ${slug}: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error finding distinct values in collection "${slug}":** ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})
