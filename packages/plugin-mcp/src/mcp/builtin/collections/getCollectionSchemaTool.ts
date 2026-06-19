import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getCollectionInputSchema } from '../../../utils/schemaConversion/getEntityInputSchema.js'

export const getCollectionSchemaTool = defineCollectionTool({
  access: (args) => {
    const permissions = args.permissions?.collections?.[args.collectionSlug]

    return (
      defaultAccess(args) &&
      Boolean(permissions?.create || permissions?.delete || permissions?.read || permissions?.update)
    )
  },
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
