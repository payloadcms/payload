import { getUploadInstructions as getPayloadUploadInstructions } from 'payload/internal'
import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'

export const getUploadInstructionsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) &&
    Boolean(
      args.permissions?.collections?.[args.collectionSlug]?.create ||
        args.permissions?.collections?.[args.collectionSlug]?.update,
    ),
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
    readOnlyHint: false,
    title: 'Get Upload Instructions',
  },
  description:
    'Prepare a file upload before createDocuments or updateDocument. Pass file metadata only, without base64 or file contents.',
  input: z.object({
    docPrefix: z.string().describe('Optional document folder or prefix').optional(),
    filename: z.string().describe('The original file name'),
    filesize: z.number().int().nonnegative().describe('The file size in bytes'),
    mimeType: z.string().describe('The file MIME type'),
  }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  try {
    const instructions = await getPayloadUploadInstructions({
      ...input,
      collectionSlug,
      overrideAccess: authorizedMCP.overrideAccess,
      req,
    })

    const nextStep =
      instructions.type === 'http'
        ? 'Send the exact file bytes using request, then pass { source: "uploadReference", file } to createDocuments or updateDocument.'
        : `Call the local MCP tool named "${instructions.name}" with the file and data, then pass { source: "uploadReference", file } to createDocuments or updateDocument.`

    return {
      content: [
        {
          type: 'text',
          text: `Upload instructions for collection "${collectionSlug}":\n\`\`\`json\n${JSON.stringify(instructions)}\n\`\`\`\n${nextStep}`,
        },
      ],
      structuredContent: { instructions },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      content: [
        {
          type: 'text',
          text: `Error getting upload instructions for collection "${collectionSlug}": ${message}`,
        },
      ],
      isError: true,
    }
  }
})
