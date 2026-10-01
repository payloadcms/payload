import {
  duplicateDocumentInputSchema,
  getCollectionVirtualFieldNames,
  parseDocumentID,
  stripVirtualFields,
  transformPointDataToPayload,
  validateCollectionData,
} from 'payload'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { formatEntityError } from '../formatEntityError.js'

const DEFAULT_DESCRIPTION =
  'Duplicate a document in any collection by passing the collection slug and source document ID.'

export const duplicateDocumentTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.slug]?.create),
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Duplicate Document',
  },
  description: DEFAULT_DESCRIPTION,
  input: duplicateDocumentInputSchema,
}).handler(async ({ slug, authorizedMCP, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const { id, data, depth, draft, fallbackLocale, locale, populate, select, selectedLocales } =
    input

  logger.info(`Duplicating document in collection: ${slug} with ID: ${id}`)

  try {
    const virtualFieldNames = getCollectionVirtualFieldNames(payload.config, slug)
    const inputData = data ? stripVirtualFields(data, virtualFieldNames) : undefined

    if (inputData) {
      validateCollectionData({
        slug,
        data: inputData,
        partial: true,
        req,
      })
    }

    const parsedData = inputData ? transformPointDataToPayload(inputData) : undefined

    const result = await payload.duplicate({
      id: parseDocumentID({ id, collectionSlug: slug, payload }),
      collection: slug,
      depth,
      draft,
      overrideAccess: authorizedMCP.overrideAccess,
      req,
      ...(parsedData ? { data: parsedData } : {}),
      ...(locale ? { locale } : {}),
      ...(fallbackLocale !== undefined ? { fallbackLocale } : {}),
      ...(populate ? { populate } : {}),
      ...(select ? { select } : {}),
      ...(selectedLocales ? { selectedLocales } : {}),
    })

    logger.info(`Successfully duplicated document in ${slug} from ID: ${id}`)

    return {
      content: [
        {
          type: 'text',
          text: `Document duplicated successfully in collection "${slug}"!\nDuplicated document:\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error duplicating document in ${slug}: ${errorMessage}`)
    return formatEntityError({ slug, action: 'duplicating', entity: 'collection', error, req })
  }
})
