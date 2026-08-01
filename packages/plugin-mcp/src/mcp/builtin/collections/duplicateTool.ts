import { getPayloadOperation, invokeOperation, type PopulateType, type SelectType } from 'payload'
import { z } from 'zod'

import { defaultAccess } from '../../../defaultAccess.js'
import { defineCollectionTool } from '../../../defineTool.js'
import { getLogger } from '../../../utils/getLogger.js'
import { formatCollectionError } from './formatCollectionError.js'

const duplicateOperation = getPayloadOperation('collection', 'duplicate')

const DEFAULT_DESCRIPTION =
  'Duplicate a document in any collection by passing the collection slug and source document ID.'

export const duplicateDocumentTool = defineCollectionTool({
  access: (args) =>
    defaultAccess(args) && Boolean(args.permissions?.collections?.[args.collectionSlug]?.create),
  annotations: {
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: 'Duplicate Document',
  },
  description: DEFAULT_DESCRIPTION,
  input: z.looseObject({
    id: duplicateOperation.input.shape.id,
    data: duplicateOperation.input.shape.data,
    depth: duplicateOperation.input.shape.depth,
    draft: duplicateOperation.input.shape.draft,
    fallbackLocale: duplicateOperation.input.shape.fallbackLocale,
    locale: duplicateOperation.input.shape.locale,
    populate: duplicateOperation.input.shape.populate,
    select: duplicateOperation.input.shape.select,
    selectedLocales: duplicateOperation.input.shape.selectedLocales,
    showHiddenFields: duplicateOperation.input.shape.showHiddenFields,
  }),
}).handler(async ({ authorizedMCP, collectionSlug, input, req }) => {
  const payload = req.payload
  const logger = getLogger({ payload })
  const {
    id,
    data,
    depth,
    draft,
    fallbackLocale,
    locale,
    populate,
    select,
    selectedLocales,
    showHiddenFields,
  } = input

  logger.info(`Duplicating document in collection: ${collectionSlug} with ID: ${id}`)

  try {
    const result = await invokeOperation(duplicateOperation, {
      context: payload,
      input: {
        id,
        collection: collectionSlug,
        depth,
        draft,
        overrideAccess: authorizedMCP.overrideAccess,
        req,
        ...(data ? { data } : {}),
        ...(locale ? { locale } : {}),
        ...(fallbackLocale ? { fallbackLocale } : {}),
        ...(populate ? { populate: populate as PopulateType } : {}),
        ...(select ? { select: select as SelectType } : {}),
        ...(selectedLocales ? { selectedLocales } : {}),
        ...(showHiddenFields !== undefined ? { showHiddenFields } : {}),
      },
    })

    logger.info(`Successfully duplicated document in ${collectionSlug} from ID: ${id}`)

    return {
      content: [
        {
          type: 'text',
          text: `Document duplicated successfully in collection "${collectionSlug}"!\nDuplicated document:\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
        },
      ],
      doc: result as Record<string, unknown>,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`Error duplicating document in ${collectionSlug}: ${errorMessage}`)
    return formatCollectionError({ action: 'duplicating', collectionSlug, error, req })
  }
})
