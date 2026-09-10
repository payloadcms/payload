import { getAccessResults, getGlobalInputSchema, getGlobalSchemaInputSchema } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'

export const getGlobalSchemaTool = defineGlobalTool({
  access: (args) => {
    const permissions = args.permissions?.globals?.[args.slug]

    return defaultAccess(args) && Boolean(permissions?.update)
  },
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Get Global Schema',
  },
  description: 'Get the input schema for updating a global.',
  input: getGlobalSchemaInputSchema,
}).handler(async ({ slug, authorizedMCP, req }) => {
  const permissions = authorizedMCP.overrideAccess
    ? null
    : (await getAccessResults({ req })).globals?.[slug]

  if (!authorizedMCP.overrideAccess && !permissions?.update) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: MCP access to "getGlobalSchema" is not enabled for global "${slug}"`,
        },
      ],
      isError: true,
    }
  }

  const inputSchema = getGlobalInputSchema({
    globalSlug: slug,
    req,
    ...(permissions ? { permissions } : {}),
  })

  if (!inputSchema) {
    return {
      content: [{ type: 'text', text: `Error: Global "${slug}" not found` }],
      isError: true,
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `Schema for global "${slug}":\n\`\`\`json\n${JSON.stringify(inputSchema)}\n\`\`\``,
      },
    ],
    structuredContent: {
      slug,
      schema: inputSchema,
    },
  }
})
