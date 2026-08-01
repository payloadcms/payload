import {
  getPayloadOperation,
  invokeOperation,
  OperationValidationError,
  type SelectType,
} from 'payload'
import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { fileInputSchema, resolveFile } from './fileInput.js'
import { formatCollectionError } from './formatCollectionError.js'

const createOperation = getPayloadOperation('collection', 'create')

const DEFAULT_DESCRIPTION =
  'Create one or more documents. Each can have different data or a file. Prefer uploadReference after upload, externalURL for URLs, or base64 for small local files.'

export const createDocumentsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.collectionSlug]?.create),
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Create Documents',
  },
  description: DEFAULT_DESCRIPTION,
  input: z.looseObject({
    depth: createOperation.input.shape.depth,
    documents: z
      .array(
        z.object({
          data: createOperation.input.shape.data,
          file: fileInputSchema.optional(),
        }),
      )
      .min(1)
      .describe('The documents to create, in order'),
    draft: createOperation.input.shape.draft,
    fallbackLocale: createOperation.input.shape.fallbackLocale,
    locale: createOperation.input.shape.locale,
    select: createOperation.input.shape.select,
  }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { depth, documents, draft, fallbackLocale, locale, select } = input

  logger.info(`Creating ${documents.length} documents in collection: ${collectionSlug}`)

  try {
    const docs: Array<{ doc: Record<string, unknown>; index: number }> = []
    const errors: Array<{ index: number; message: string }> = []
    let validationSchema: Record<string, unknown> | undefined

    for (const [index, document] of documents.entries()) {
      try {
        const file = await resolveFile({ collectionSlug, input: document.file, req })
        const result = await invokeOperation(createOperation, {
          context: payload,
          input: {
            collection: collectionSlug,
            data: document.data,
            depth,
            draft,
            overrideAccess: authorizedMCP.overrideAccess,
            req,
            ...(file ? { file } : {}),
            ...(locale ? { locale } : {}),
            ...(fallbackLocale ? { fallbackLocale } : {}),
            ...(select ? { select: select as SelectType } : {}),
          },
        })

        docs.push({ doc: result as Record<string, unknown>, index })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        if (error instanceof OperationValidationError && !validationSchema) {
          validationSchema = error.schema
        }

        logger.error(`Error creating document at index ${index} in ${collectionSlug}: ${message}`)
        errors.push({ index, message })
      }
    }

    const batchResult = { docs, errors }
    const retryMessage = errors.length > 0 ? '\nRetry failed indexes only.' : ''
    const schemaMessage = validationSchema
      ? `\n\nUse this schema for data:\n\`\`\`json\n${JSON.stringify(validationSchema)}\n\`\`\``
      : ''
    const structuredContent = validationSchema
      ? { ...batchResult, schema: validationSchema }
      : batchResult

    logger.info(`Created ${docs.length} of ${documents.length} documents in ${collectionSlug}`)

    return {
      content: [
        {
          type: 'text',
          text: `Created ${docs.length} of ${documents.length} documents in collection "${collectionSlug}".${retryMessage}\nResults:\n\`\`\`json\n${JSON.stringify(batchResult)}\n\`\`\`${schemaMessage}`,
        },
      ],
      doc: structuredContent as unknown as Record<string, unknown>,
      isError: docs.length === 0 && errors.length > 0,
      structuredContent,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    logger.error(`Error creating documents in ${collectionSlug}: ${message}`)
    return formatCollectionError({ action: 'creating', collectionSlug, error, req })
  }
})
