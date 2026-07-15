import { getAccessResults } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getCollectionInputSchema } from '../../../utils/schemaConversion/getEntityInputSchema.js'

export const getCollectionSchemaTool = defineCollectionTool({
  access: (args) => {
    const permissions = args.permissions?.collections?.[args.collectionSlug]

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
}).handler(async ({ authorizedMCP, collectionSlug, req }) => {
  const permissions = authorizedMCP.overrideAccess
    ? null
    : (await getAccessResults({ req })).collections?.[collectionSlug]

  if (!authorizedMCP.overrideAccess && !permissions?.create && !permissions?.update) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: MCP access to "getCollectionSchema" is not enabled for collection "${collectionSlug}"`,
        },
      ],
      isError: true,
    }
  }

  const inputSchema = getCollectionInputSchema({
    collectionSlug,
    req,
    ...(permissions ? { permissions } : {}),
  })

  if (!inputSchema) {
    return {
      content: [{ type: 'text', text: `Error: Collection "${collectionSlug}" not found` }],
      isError: true,
    }
  }

  const uploadConfig = req.payload.collections[collectionSlug]?.config.upload
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
        text: `Schema for collection "${collectionSlug}":\n\`\`\`json\n${JSON.stringify(inputSchema)}\n\`\`\`\nUpload configuration:\n\`\`\`json\n${JSON.stringify(upload)}\n\`\`\``,
      },
    ],
    structuredContent: {
      collectionSlug,
      schema: inputSchema,
      upload,
    },
  }
})
