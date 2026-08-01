import { getPayloadOperation, invokeOperation } from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'

const getUploadInstructionsOperation = getPayloadOperation('upload', 'getInstructions')

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
    'Prepare uploads for createDocuments or updateDocument. This does not upload bytes; finish the returned action before use.',
  input: getUploadInstructionsOperation.input.omit({
    collectionSlug: true,
    overrideAccess: true,
    req: true,
  }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  try {
    const instructions = await invokeOperation(getUploadInstructionsOperation, {
      context: req.payload,
      input: {
        ...input,
        collectionSlug,
        overrideAccess: authorizedMCP.overrideAccess,
        req,
      },
    })

    const nextStep =
      instructions.type === 'http'
        ? 'Upload bytes with instructions.request. After success, pass { source: "uploadReference", file: instructions.file }.'
        : `Call "${instructions.name}" with file and data. After success, pass { source: "uploadReference", file: instructions.file }.`

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
