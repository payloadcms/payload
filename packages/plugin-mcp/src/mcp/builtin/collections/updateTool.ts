import type { SelectType } from 'payload'

import type { CollectionTool } from '../../../types.js'

import { getLogger } from '../../../utils/getLogger.js'
import {
  getCollectionVirtualFieldNames,
  stripVirtualFields,
} from '../../../utils/getVirtualFieldNames.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { prepareCollectionSchema } from '../../../utils/schemaConversion/prepareCollectionSchema.js'
import { transformPointDataToPayload } from '../../../utils/transformPointDataToPayload.js'

const DEFAULT_DESCRIPTION = 'Update documents in a collection by ID or where clause.'

export const updateCollectionTool: CollectionTool = {
  description: DEFAULT_DESCRIPTION,
  handler: async ({ authorizedMCP, collectionSlug, input, req }) => {
    const payload = req.payload
    const logger = getLogger({ payload })

    const {
      id,
      depth = 0,
      draft = false,
      fallbackLocale,
      filePath,
      locale,
      overrideLock = true,
      overwriteExistingFiles = false,
      select,
      where,
      ...fieldData
    } = input

    logger.info(
      `Updating document in collection: ${collectionSlug}${id ? ` with ID: ${id}` : ' with where clause'}, draft: ${draft}${locale ? `, locale: ${locale as string}` : ''}`,
    )

    try {
      if (!id && !where) {
        return {
          content: [{ type: 'text', text: 'Error: Either id or where clause must be provided' }],
        }
      }

      let parsedData = transformPointDataToPayload(fieldData)
      const virtualFieldNames = getCollectionVirtualFieldNames(payload.config, collectionSlug)
      parsedData = stripVirtualFields(parsedData, virtualFieldNames)

      let whereClause: Record<string, unknown> = {}
      if (where) {
        try {
          whereClause = JSON.parse(where as string) as Record<string, unknown>
        } catch {
          logger.error(`Invalid where clause JSON: ${String(where)}`)
          return { content: [{ type: 'text', text: 'Error: Invalid JSON in where clause' }] }
        }
      }

      let selectClause: SelectType | undefined
      if (select) {
        try {
          selectClause = JSON.parse(select as string) as SelectType
        } catch {
          logger.warn(`Invalid select clause JSON: ${String(select)}`)
          return { content: [{ type: 'text', text: 'Error: Invalid JSON in select clause' }] }
        }
      }

      if (id) {
        const updateOptions = {
          id: id as number | string,
          collection: collectionSlug,
          data: parsedData,
          depth: depth as number,
          draft: draft as boolean,
          overrideLock: overrideLock as boolean,
          req,
          ...localAPIDefaults(authorizedMCP),
          ...(filePath ? { filePath: filePath as string } : {}),
          ...(overwriteExistingFiles
            ? { overwriteExistingFiles: overwriteExistingFiles as boolean }
            : {}),
          ...(locale ? { locale: locale as string } : {}),
          ...(fallbackLocale ? { fallbackLocale: fallbackLocale as string } : {}),
          ...(selectClause ? { select: selectClause } : {}),
        }

        const result = await payload.update(updateOptions as any)

        return {
          content: [
            {
              type: 'text',
              text: `Document updated successfully in collection "${collectionSlug}"!\nUpdated document:\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\``,
            },
          ],
          doc: result as Record<string, unknown>,
        }
      }

      const updateOptions = {
        collection: collectionSlug,
        data: parsedData,
        depth: depth as number,
        draft: draft as boolean,
        overrideLock: overrideLock as boolean,
        req,
        ...localAPIDefaults(authorizedMCP),
        where: whereClause,
        ...(filePath ? { filePath: filePath as string } : {}),
        ...(overwriteExistingFiles
          ? { overwriteExistingFiles: overwriteExistingFiles as boolean }
          : {}),
        ...(locale ? { locale: locale as string } : {}),
        ...(fallbackLocale ? { fallbackLocale: fallbackLocale as string } : {}),
        ...(selectClause ? { select: selectClause } : {}),
      }

      const result = await payload.update(updateOptions as any)

      const bulkResult = result as { docs?: unknown[]; errors?: unknown[] }
      const docs = bulkResult.docs || []
      const errors = bulkResult.errors || []

      let responseText = `Multiple documents updated in collection "${collectionSlug}"!\nUpdated: ${docs.length} documents\nErrors: ${errors.length}\n---`
      if (docs.length > 0) {
        responseText += `\n\nUpdated documents:\n\`\`\`json\n${JSON.stringify(docs)}\n\`\`\``
      }
      if (errors.length > 0) {
        responseText += `\n\nErrors:\n\`\`\`json\n${JSON.stringify(errors)}\n\`\`\``
      }

      return {
        content: [{ type: 'text', text: responseText }],
        doc: { docs, errors } as unknown as Record<string, unknown>,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error updating document in ${collectionSlug}: ${errorMessage}`)
      return {
        content: [
          {
            type: 'text',
            text: `Error updating document in collection "${collectionSlug}": ${errorMessage}`,
          },
        ],
      }
    }
  },
  input: ({ collectionSchema }) => {
    const collectionFields = prepareCollectionSchema(collectionSchema)

    return {
      type: 'object',
      properties: {
        ...(collectionFields.properties ?? {}),
        id: {
          type: ['string', 'number'],
          description: 'The ID of the document to update',
        },
        depth: {
          type: 'number',
          default: 0,
          description: 'How many levels deep to populate relationships',
        },
        draft: {
          type: 'boolean',
          default: false,
          description: 'Whether to update the document as a draft',
        },
        fallbackLocale: {
          type: 'string',
          description:
            'Optional: fallback locale code to use when requested locale is not available',
        },
        filePath: { type: 'string', description: 'File path for file uploads' },
        locale: {
          type: 'string',
          description:
            'Optional: locale code to update the document in (e.g., "en", "es"). Defaults to the default locale',
        },
        overrideLock: {
          type: 'boolean',
          default: true,
          description: 'Whether to override document locks',
        },
        overwriteExistingFiles: {
          type: 'boolean',
          default: false,
          description: 'Whether to overwrite existing files',
        },
        select: {
          type: 'string',
          description:
            'Optional: define exactly which fields you\'d like to return in the response (JSON), e.g., \'{"title": "My Post"}\'',
        },
        where: {
          type: 'string',
          description: 'JSON string for where clause to update multiple documents',
        },
      },
    }
  },
}
