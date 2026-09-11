import { getAccessResults, getCollectionInputSchema, getCollectionSchemaInputSchema } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'

export const getCollectionSchemaTool = defineCollectionTool({
  access: (args) => {
    const permissions = args.permissions?.collections?.[args.slug]

    return defaultAccess(args) && Boolean(permissions?.create || permissions?.update)
  },
  annotations: {
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: 'Get Collection Schema',
  },
  description: 'Get the input schema for creating or updating documents in a collection.',
  input: getCollectionSchemaInputSchema,
}).handler(async ({ slug, authorizedMCP, req }) => {
  const permissions = authorizedMCP.overrideAccess
    ? null
    : (await getAccessResults({ req })).collections?.[slug]

  if (!authorizedMCP.overrideAccess && !permissions?.create && !permissions?.update) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: MCP access to "getCollectionSchema" is not enabled for collection "${slug}"`,
        },
      ],
      isError: true,
    }
  }

  const inputSchema = getCollectionInputSchema({
    collectionSlug: slug,
    req,
    ...(permissions ? { permissions } : {}),
  })

  if (!inputSchema) {
    return {
      content: [{ type: 'text', text: `Error: Collection "${slug}" not found` }],
      isError: true,
    }
  }

  const uploadConfig = req.payload.collections[slug]?.config.upload
  const maxFileSize = req.payload.config.upload.limits?.fileSize
  const upload = uploadConfig
    ? {
        enabled: true,
        filesRequiredOnCreate: uploadConfig.filesRequiredOnCreate !== false,
        mimeTypes: uploadConfig.mimeTypes ?? ['*/*'],
        sources: [
          ...(uploadConfig.pasteURL !== false ? ['externalURL'] : []),
          'base64',
          'uploadReference',
        ],
        ...(typeof maxFileSize === 'number' && Number.isFinite(maxFileSize) ? { maxFileSize } : {}),
      }
    : { enabled: false }

  return {
    content: [
      {
        type: 'text',
        text: `Schema for collection "${slug}":\n\`\`\`json\n${JSON.stringify(inputSchema)}\n\`\`\`\nUpload configuration:\n\`\`\`json\n${JSON.stringify(upload)}\n\`\`\``,
      },
    ],
    structuredContent: {
      slug,
      schema: inputSchema,
      upload,
    },
  }
})
