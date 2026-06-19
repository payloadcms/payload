import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getCollectionInputSchema } from '../../../utils/schemaConversion/getEntityInputSchema.js'

export const getCollectionSchemaTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.collectionSlug]?.read),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Get Collection Schema',
  },
  description: 'Get the input schema for creating or updating documents in a collection.',
}).handler(({ collectionSlug, req }) => {
  const inputSchema = getCollectionInputSchema({ collectionSlug, req })

  if (!inputSchema) {
    return {
      content: [{ type: 'text', text: `Error: Collection "${collectionSlug}" not found` }],
      isError: true,
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `Schema for collection "${collectionSlug}":\n\`\`\`json\n${JSON.stringify(inputSchema)}\n\`\`\``,
      },
    ],
    structuredContent: {
      collectionSlug,
      schema: inputSchema,
    },
  }
})
