import { defineGlobalTool } from '../../../defineTool.js'
import { getGlobalInputSchema } from '../../../utils/schemaConversion/getEntityInputSchema.js'

export const getGlobalSchemaTool = defineGlobalTool({
  access: ({ globalSlug, permissions }) =>
    !permissions || Boolean(permissions.globals?.[globalSlug]?.read),
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Get Global Schema',
  },
  description: 'Get the input schema for updating a global.',
}).handler(({ globalSlug, req }) => {
  const inputSchema = getGlobalInputSchema({ globalSlug, req })

  if (!inputSchema) {
    return {
      content: [{ type: 'text', text: `Error: Global "${globalSlug}" not found` }],
      isError: true,
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `Schema for global "${globalSlug}":\n\`\`\`json\n${JSON.stringify(inputSchema)}\n\`\`\``,
      },
    ],
    structuredContent: {
      globalSlug,
      schema: inputSchema,
    },
  }
})
