import { getAccessResults } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineGlobalTool } from '../../../defineTool.js'
import { getGlobalInputSchema } from '../../../utils/schemaConversion/getEntityInputSchema.js'

export const getGlobalSchemaTool = defineGlobalTool({
  access: (args) => {
    const permissions = args.permissions?.globals?.[args.globalSlug]

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
}).handler(async ({ authorizedMCP, globalSlug, req }) => {
  const permissions = authorizedMCP.overrideAccess
    ? null
    : (await getAccessResults({ req })).globals?.[globalSlug]

  if (!authorizedMCP.overrideAccess && !permissions?.update) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: MCP access to "getGlobalSchema" is not enabled for global "${globalSlug}"`,
        },
      ],
      isError: true,
    }
  }

  const inputSchema = getGlobalInputSchema({
    globalSlug,
    req,
    ...(permissions ? { permissions } : {}),
  })

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
