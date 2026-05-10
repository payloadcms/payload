import type { McpServer } from '@modelcontextprotocol/server'
import type { PayloadRequest, SelectType } from 'payload'

import { fromJsonSchema } from '@modelcontextprotocol/server'

import type { JsonSchemaObject, MCPAccess, MCPPluginConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { getLogger } from '../../../utils/getLogger.js'
import {
  getCollectionVirtualFieldNames,
  stripVirtualFields,
} from '../../../utils/getVirtualFieldNames.js'
import { localAPIDefaults } from '../../../utils/localAPIDefaults.js'
import { prepareCollectionSchema } from '../../../utils/schemaConversion/prepareCollectionSchema.js'
import { transformPointDataToPayload } from '../../../utils/transformPointDataToPayload.js'
import { toolSchemas } from '../schemas.js'
export const updateDocumentTool = (
  server: McpServer,
  req: PayloadRequest,
  mcpAccess: MCPAccess,
  collectionSlug: string,
  collections: MCPPluginConfig['collections'],
  schema: JsonSchemaObject,
) => {
  const tool = async (
    data: string,
    id?: number | string,
    where?: string,
    draft: boolean = false,
    depth: number = 0,
    overrideLock: boolean = true,
    filePath?: string,
    overwriteExistingFiles: boolean = false,
    locale?: string,
    fallbackLocale?: string,
    select?: string,
  ): Promise<{
    content: Array<{
      text: string
      type: 'text'
    }>
  }> => {
    const payload = req.payload
    const logger = getLogger({ payload })

    logger.info(
      `Updating document in collection: ${collectionSlug}${id ? ` with ID: ${id}` : ' with where clause'}, draft: ${draft}${locale ? `, locale: ${locale}` : ''}`,
    )

    try {
      // Parse the data JSON
      let parsedData: Record<string, unknown>
      try {
        parsedData = JSON.parse(data)

        // Transform point fields from object format to tuple array
        parsedData = transformPointDataToPayload(parsedData)

        const virtualFieldNames = getCollectionVirtualFieldNames(payload.config, collectionSlug)
        parsedData = stripVirtualFields(parsedData, virtualFieldNames)

        logger.info(`Parsed data for ${collectionSlug}: ${JSON.stringify(parsedData)}`)
      } catch (_parseError) {
        logger.error(`Invalid JSON data provided: ${data}`)
        const response = {
          content: [{ type: 'text' as const, text: 'Error: Invalid JSON data provided' }],
        }
        return (collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) ||
          response) as {
          content: Array<{
            text: string
            type: 'text'
          }>
        }
      }

      // Validate that either id or where is provided
      if (!id && !where) {
        logger.error('Either id or where clause must be provided')
        const response = {
          content: [
            { type: 'text' as const, text: 'Error: Either id or where clause must be provided' },
          ],
        }
        return (collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) ||
          response) as {
          content: Array<{
            text: string
            type: 'text'
          }>
        }
      }

      // Parse where clause if provided
      let whereClause = {}
      if (where) {
        try {
          whereClause = JSON.parse(where)
          logger.info(`Using where clause: ${where}`)
        } catch (_parseError) {
          logger.error(`Invalid where clause JSON: ${where}`)
          const response = {
            content: [{ type: 'text' as const, text: 'Error: Invalid JSON in where clause' }],
          }
          return (collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) ||
            response) as {
            content: Array<{
              text: string
              type: 'text'
            }>
          }
        }
      }

      let selectClause: SelectType | undefined
      if (select) {
        try {
          selectClause = JSON.parse(select) as SelectType
        } catch (_parseError) {
          logger.warn(`Invalid select clause JSON: ${select}`)
          const response = {
            content: [{ type: 'text' as const, text: 'Error: Invalid JSON in select clause' }],
          }
          return (collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) ||
            response) as {
            content: Array<{
              text: string
              type: 'text'
            }>
          }
        }
      }

      // Update by ID or where clause
      if (id) {
        // Single document update
        const updateOptions = {
          id,
          collection: collectionSlug,
          data: parsedData,
          depth,
          draft,
          overrideLock,
          req,
          ...localAPIDefaults(mcpAccess),
          ...(filePath && { filePath }),
          ...(overwriteExistingFiles && { overwriteExistingFiles }),
          ...(locale && { locale }),
          ...(fallbackLocale && { fallbackLocale }),
          ...(selectClause && { select: selectClause }),
        }

        logger.info(`Updating single document with ID: ${id}`)
        const result = await payload.update({
          ...updateOptions,
          data: parsedData,
        } as any)

        logger.info(`Successfully updated document with ID: ${id}`)

        const response = {
          content: [
            {
              type: 'text' as const,
              text: `Document updated successfully in collection "${collectionSlug}"!
Updated document:
\`\`\`json
${JSON.stringify(result)}
\`\`\``,
            },
          ],
        }

        return (collections?.[collectionSlug]?.overrideResponse?.(response, result, req) ||
          response) as {
          content: Array<{
            text: string
            type: 'text'
          }>
        }
      } else {
        // Multiple documents update
        const updateOptions = {
          collection: collectionSlug,
          data: parsedData,
          depth,
          draft,
          overrideLock,
          req,
          ...localAPIDefaults(mcpAccess),
          where: whereClause,
          ...(filePath && { filePath }),
          ...(overwriteExistingFiles && { overwriteExistingFiles }),
          ...(locale && { locale }),
          ...(fallbackLocale && { fallbackLocale }),
          ...(selectClause && { select: selectClause }),
        }

        logger.info(`Updating multiple documents with where clause`)
        const result = await payload.update({
          ...updateOptions,
          data: parsedData,
        } as any)

        const bulkResult = result as { docs?: unknown[]; errors?: unknown[] }
        const docs = bulkResult.docs || []
        const errors = bulkResult.errors || []

        logger.info(`Successfully updated ${docs.length} documents, ${errors.length} errors`)

        let responseText = `Multiple documents updated in collection "${collectionSlug}"!
Updated: ${docs.length} documents
Errors: ${errors.length}
---`

        if (docs.length > 0) {
          responseText += `\n\nUpdated documents:
\`\`\`json
${JSON.stringify(docs)}
\`\`\``
        }

        if (errors.length > 0) {
          responseText += `\n\nErrors:
\`\`\`json
${JSON.stringify(errors)}
\`\`\``
        }

        const response = {
          content: [
            {
              type: 'text' as const,
              text: responseText,
            },
          ],
        }

        return (collections?.[collectionSlug]?.overrideResponse?.(
          response,
          { docs, errors },
          req,
        ) || response) as {
          content: Array<{
            text: string
            type: 'text'
          }>
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Error updating document in ${collectionSlug}: ${errorMessage}`)

      const response = {
        content: [
          {
            type: 'text' as const,
            text: `Error updating document in collection "${collectionSlug}": ${errorMessage}`,
          },
        ],
      }

      return (collections?.[collectionSlug]?.overrideResponse?.(response, {}, req) || response) as {
        content: Array<{
          text: string
          type: 'text'
        }>
      }
    }
  }

  {
    const collectionFields = prepareCollectionSchema(schema)

    // Update is a partial update — all collection fields are optional, no `required`.
    const inputSchemaJson: JsonSchemaObject = {
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

    server.registerTool(
      `update${collectionSlug.charAt(0).toUpperCase() + toCamelCase(collectionSlug).slice(1)}`,
      {
        description: `${collections?.[collectionSlug]?.description || toolSchemas.updateDocument.description.trim()}`,
        inputSchema: fromJsonSchema(inputSchemaJson as Parameters<typeof fromJsonSchema>[0]),
      },
      async (rawParams: unknown) => {
        const params = (rawParams ?? {}) as Record<string, unknown>
        const {
          id,
          depth,
          draft,
          fallbackLocale,
          filePath,
          locale,
          overrideLock,
          overwriteExistingFiles,
          select,
          where,
          ...fieldData
        } = params
        // Convert field data back to JSON string format expected by the tool
        const data = JSON.stringify(fieldData)
        return await tool(
          data,
          id as number | string | undefined,
          where as string | undefined,
          draft as boolean,
          depth as number,
          overrideLock as boolean,
          filePath as string | undefined,
          overwriteExistingFiles as boolean,
          locale as string | undefined,
          fallbackLocale as string | undefined,
          select as string | undefined,
        )
      },
    )
  }
}
