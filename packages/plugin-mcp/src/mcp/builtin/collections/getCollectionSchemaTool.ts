import { defineCollectionTool } from '../../../defineTool.js'
import { getCollectionInputSchema } from '../../../utils/schemaConversion/getCollectionInputSchema.js'

export const getCollectionSchemaTool = defineCollectionTool({
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
