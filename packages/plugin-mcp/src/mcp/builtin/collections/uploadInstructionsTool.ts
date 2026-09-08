import { strictObject, z } from 'payload'
import { getUploadInstructions as getPayloadUploadInstructions } from 'payload/internal'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'

export const getUploadInstructionsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) &&
    Boolean(
      args.permissions?.collections?.[args.slug]?.create ||
        args.permissions?.collections?.[args.slug]?.update,
    ),
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
    readOnlyHint: false,
    title: 'Get Upload Instructions',
  },
  description:
    'Prepare uploads for createDocuments or updateDocument. This does not upload bytes; finish the returned action before use.',
  input: strictObject({
    docPrefix: z.optional(z.string()).check(z.describe('Document folder or prefix.')),
    filename: z.string().check(z.describe('The original file name.')),
    filesize: z.int().check(z.nonnegative(), z.describe('The file size in bytes.')),
    mimeType: z.string().check(z.describe('The file MIME type.')),
  }),
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  try {
    const instructions = await getPayloadUploadInstructions({
      ...input,
      collectionSlug: slug,
      overrideAccess: authorizedMCP.overrideAccess,
      req,
    })

    const nextStep =
      instructions.type === 'http'
        ? 'Upload bytes with instructions.request. After success, pass { source: "uploadReference", file: instructions.file }.'
        : `Call "${instructions.name}" with file and data. After success, pass { source: "uploadReference", file: instructions.file }.`

    return {
      content: [
        {
          type: 'text',
          text: `Upload instructions for collection "${slug}":\n\`\`\`json\n${JSON.stringify(instructions)}\n\`\`\`\n${nextStep}`,
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
          text: `Error getting upload instructions for collection "${slug}": ${message}`,
        },
      ],
      isError: true,
    }
  }
})
