import {
  createDocumentsInputSchema,
  getCollectionVirtualFieldNames,
  hasDraftValidationEnabled,
  stripVirtualFields,
  transformPointDataToPayload,
  validateCollectionData,
} from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { formatEntityError } from '../formatEntityError.js'
import { fileInputSchema, resolveFile } from './fileInput.js'

const DEFAULT_DESCRIPTION =
  'Create one or more documents. Each can have different data or a file. Prefer uploadReference after upload, externalURL for URLs, or base64 for small local files.'

export const createDocumentsTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.slug]?.create),
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Create Documents',
  },
  description: DEFAULT_DESCRIPTION,
  input: createDocumentsInputSchema({ file: fileInputSchema }),
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const collectionConfig = payload.collections[slug]?.config
  const logger = getLogger({ payload })
  const {
    depth,
    documents,
    draft,
    fallbackLocale,
    locale,
    populate,
    publishAllLocales,
    returning,
    select,
  } = input
  const shouldUsePartialSchema =
    draft === true && collectionConfig !== undefined && !hasDraftValidationEnabled(collectionConfig)

  logger.info(`Creating ${documents.length} documents in collection: ${slug}`)

  try {
    const virtualFieldNames = getCollectionVirtualFieldNames(payload.config, slug)
    const docs: Array<
      { doc: Record<string, unknown>; index: number } | { id: number | string; index: number }
    > = []
    const errors: Array<{ index: number; message: string }> = []
    let validationSchema: Record<string, unknown> | undefined

    for (const [index, document] of documents.entries()) {
      try {
        const inputData = stripVirtualFields(document.data, virtualFieldNames)
        validateCollectionData({
          slug,
          data: inputData,
          partial: shouldUsePartialSchema,
          req,
        })

        const parsedData = transformPointDataToPayload(inputData)
        const file = await resolveFile({ slug, input: document.file, req })
        const result = await payload.create({
          collection: slug,
          data: parsedData,
          depth,
          draft,
          overrideAccess: authorizedMCP.overrideAccess,
          populate,
          publishAllLocales,
          req,
          ...(file ? { file } : {}),
          ...(locale ? { locale } : {}),
          ...(fallbackLocale !== undefined ? { fallbackLocale } : {}),
          select: returning ? select : { id: true },
        })

        docs.push(
          returning ? { doc: result as Record<string, unknown>, index } : { id: result.id, index },
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        const formattedError = formatEntityError({
          slug,
          action: 'creating',
          entity: 'collection',
          error,
          req,
        })
        const structuredContent = formattedError.structuredContent as
          | { schema?: unknown }
          | undefined
        const schema = structuredContent?.schema
        const errorContent = formattedError.content[0]
        const formattedMessage =
          errorContent?.type === 'text'
            ? (errorContent.text.split('\n\nUse this schema')[0] ?? message)
            : message

        if (!validationSchema && schema && typeof schema === 'object') {
          validationSchema = schema as Record<string, unknown>
        }

        logger.error(`Error creating document at index ${index} in ${slug}: ${message}`)
        errors.push({ index, message: formattedMessage })
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

    logger.info(`Created ${docs.length} of ${documents.length} documents in ${slug}`)

    return {
      content: [
        {
          type: 'text',
          text: `Created ${docs.length} of ${documents.length} documents in collection "${slug}".${retryMessage}\nResults:\n\`\`\`json\n${JSON.stringify(batchResult)}\n\`\`\`${schemaMessage}`,
        },
      ],
      doc: structuredContent as unknown as Record<string, unknown>,
      isError: docs.length === 0 && errors.length > 0,
      structuredContent,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    logger.error(`Error creating documents in ${slug}: ${message}`)
    return formatEntityError({ slug, action: 'creating', entity: 'collection', error, req })
  }
})
