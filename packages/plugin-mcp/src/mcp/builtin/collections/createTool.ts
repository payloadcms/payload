import type { SelectType } from 'payload'

import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import {
  getCollectionVirtualFieldNames,
  stripVirtualFields,
} from '../../../utils/getVirtualFieldNames.js'
import { transformPointDataToPayload } from '../../../utils/transformPointDataToPayload.js'
import { validateCollectionData } from '../validateEntityData.js'
import { fileInputSchema, resolveFile } from './fileInput.js'
import { formatCollectionError } from './formatCollectionError.js'

const DEFAULT_DESCRIPTION =
  'Create one or more documents in any collection. Each document can have different data or a file. Files can use a URL, base64, or an upload prepared by getUploadInstructions.'

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
  input: z.object({
    depth: z
      .number()
      .int()
      .min(0)
      .max(10)
      .describe('How many levels deep to populate relationships in response')
      .optional()
      .default(0),
    documents: z
      .array(
        z.object({
          data: z
            .record(z.string(), z.unknown())
            .describe(
              'The document fields to create. Only include fields permitted by the schema returned by getCollectionSchema.',
            ),
          file: fileInputSchema.optional(),
        }),
      )
      .min(1)
      .describe('The documents to create, in order'),
    draft: z
      .boolean()
      .describe(
        'Only if getCollectionSchema includes _status; otherwise _status does not exist. true forces data._status to "draft"; with false, data._status controls draft or published.',
      )
      .optional()
      .default(false),
    fallbackLocale: z
      .string()
      .describe('Optional: fallback locale code to use when requested locale is not available')
      .optional(),
    locale: z
      .string()
      .describe(
        'Optional: locale code to create the documents in (e.g., "en", "es"). Defaults to the default locale',
      )
      .optional(),
    select: z
      .record(z.string(), z.unknown())
      .describe(
        'Optional: define exactly which fields you\'d like to return, e.g., {"title": true}',
      )
      .optional(),
  }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { depth, documents, draft, fallbackLocale, locale, select } = input

  logger.info(`Creating ${documents.length} documents in collection: ${collectionSlug}`)

  try {
    const virtualFieldNames = getCollectionVirtualFieldNames(payload.config, collectionSlug)
    const docs: Array<{ doc: Record<string, unknown>; index: number }> = []
    const errors: Array<{ index: number; message: string }> = []
    let validationSchema: Record<string, unknown> | undefined

    for (const [index, document] of documents.entries()) {
      try {
        const inputData = stripVirtualFields(document.data, virtualFieldNames)
        const validationError = validateCollectionData({ collectionSlug, data: inputData, req })

        if (validationError) {
          const firstContent = validationError.content[0]
          const validationContent = validationError.structuredContent as
            | Record<string, unknown>
            | undefined
          const schema = validationContent?.schema

          if (!validationSchema && schema && typeof schema === 'object') {
            validationSchema = schema as Record<string, unknown>
          }

          errors.push({
            index,
            message:
              firstContent?.type === 'text'
                ? (firstContent.text.split('\n\nUse this schema')[0] ?? 'Invalid document data')
                : 'Invalid document data',
          })
          continue
        }

        const parsedData = transformPointDataToPayload(inputData)
        const file = await resolveFile({ collectionSlug, input: document.file, req })
        const result = await payload.create({
          collection: collectionSlug,
          data: parsedData,
          depth,
          draft,
          overrideAccess: authorizedMCP.overrideAccess,
          req,
          ...(file ? { file } : {}),
          ...(locale ? { locale } : {}),
          ...(fallbackLocale ? { fallbackLocale } : {}),
          ...(select ? { select: select as SelectType } : {}),
        })

        docs.push({ doc: result as Record<string, unknown>, index })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

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
