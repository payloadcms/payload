import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { JSONSchema4 } from 'json-schema'
import type { PayloadRequest, TypedUser } from 'payload'

import { z } from 'zod'

import type { PluginMCPServerConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { convertCollectionSchemaToZod } from '../../../utils/convertCollectionSchemaToZod.js'
import { toolSchemas } from '../schemas.js'
export const updateResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  user: TypedUser,
  verboseLogs: boolean,
  collectionSlug: string,
  collections: PluginMCPServerConfig['collections'],
  schema: JSONSchema4,
) => {
  const tool = async (
    data: string,
    id?: string,
    where?: string,
    draft: boolean = false,
    depth: number = 0,
    overrideLock: boolean = true,
    filePath?: string,
    overwriteExistingFiles: boolean = false,
    locale?: string,
    fallbackLocale?: string,
  ): Promise<{
    content: Array<{
      text: string
      type: 'text'
    }>
  }> => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Updating resource in collection: ${collectionSlug}${id ? ` with ID: ${id}` : ' with where clause'}, draft: ${draft}${locale ? `, locale: ${locale}` : ''}`,
      )
    }

    try {
      // Parse the data JSON
      let parsedData: Record<string, unknown>
      try {
        parsedData = JSON.parse(data)
        if (verboseLogs) {
          payload.logger.info(
            `[payload-mcp] Parsed data for ${collectionSlug}: ${JSON.stringify(parsedData)}`,
          )
        }
      } catch (_parseError) {
        payload.logger.error(`[payload-mcp] Invalid JSON data provided: ${data}`)
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
        payload.logger.error('[payload-mcp] Either id or where clause must be provided')
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
          if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Using where clause: ${where}`)
          }
        } catch (_parseError) {
          payload.logger.error(`[payload-mcp] Invalid where clause JSON: ${where}`)
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
          user,
          ...(filePath && { filePath }),
          ...(overwriteExistingFiles && { overwriteExistingFiles }),
          ...(locale && { locale }),
          ...(fallbackLocale && { fallbackLocale }),
        }

        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Updating single document with ID: ${id}`)
        }
        const result = await payload.update({
          ...updateOptions,
          data: collections?.[collectionSlug]?.override?.(parsedData, req) || parsedData,
        } as any)

        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Successfully updated document with ID: ${id}`)
        }

        const response = {
          content: [
            {
              type: 'text' as const,
              text: `Document updated successfully in collection "${collectionSlug}"!
Updated document:
\`\`\`json
${JSON.stringify(result, null, 2)}
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
          overrideAccess: true,
          overrideLock,
          where: whereClause,
          ...(filePath && { filePath }),
          ...(overwriteExistingFiles && { overwriteExistingFiles }),
          ...(locale && { locale }),
          ...(fallbackLocale && { fallbackLocale }),
        }

        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Updating multiple documents with where clause`)
        }
        const result = await payload.update({
          ...updateOptions,
          data: collections?.[collectionSlug]?.override?.(parsedData, req) || parsedData,
        } as any)

        const bulkResult = result as { docs?: unknown[]; errors?: unknown[] }
        const docs = bulkResult.docs || []
        const errors = bulkResult.errors || []

        if (verboseLogs) {
          payload.logger.info(
            `[payload-mcp] Successfully updated ${docs.length} documents, ${errors.length} errors`,
          )
        }

        let responseText = `Multiple documents updated in collection "${collectionSlug}"!
Updated: ${docs.length} documents
Errors: ${errors.length}
---`

        if (docs.length > 0) {
          responseText += `\n\nUpdated documents:
\`\`\`json
${JSON.stringify(docs, null, 2)}
\`\`\``
        }

        if (errors.length > 0) {
          responseText += `\n\nErrors:
\`\`\`json
${JSON.stringify(errors, null, 2)}
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
      payload.logger.error(
        `[payload-mcp] Error updating resource in ${collectionSlug}: ${errorMessage}`,
      )

      const response = {
        content: [
          {
            type: 'text' as const,
            text: `Error updating resource in collection "${collectionSlug}": ${errorMessage}`,
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

  if (collections?.[collectionSlug]?.enabled) {
    const convertedFields = convertCollectionSchemaToZod(schema)

    // Create a new schema that combines the converted fields with update-specific parameters
    const updateResourceSchema = z.object({
      ...convertedFields.shape,
      id: z.string().optional().describe('The ID of the document to update'),
      depth: z
        .number()
        .optional()
        .default(0)
        .describe('How many levels deep to populate relationships'),
      draft: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to update the document as a draft'),
      fallbackLocale: z
        .string()
        .optional()
        .describe('Optional: fallback locale code to use when requested locale is not available'),
      filePath: z.string().optional().describe('File path for file uploads'),
      locale: z
        .string()
        .optional()
        .describe(
          'Optional: locale code to update the document in (e.g., "en", "es"). Defaults to the default locale',
        ),
      overrideLock: z
        .boolean()
        .optional()
        .default(true)
        .describe('Whether to override document locks'),
      overwriteExistingFiles: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to overwrite existing files'),
      where: z
        .string()
        .optional()
        .describe('JSON string for where clause to update multiple documents'),
    })

    server.tool(
      `update${collectionSlug.charAt(0).toUpperCase() + toCamelCase(collectionSlug).slice(1)}`,
      `${toolSchemas.updateResource.description.trim()}\n\n${collections?.[collectionSlug]?.description || ''}`,
      updateResourceSchema.shape,
      async (params: Record<string, unknown>) => {
        const {
          id,
          depth,
          draft,
          fallbackLocale,
          filePath,
          locale,
          overrideLock,
          overwriteExistingFiles,
          where,
          ...fieldData
        } = params
        // Convert field data back to JSON string format expected by the tool
        const data = JSON.stringify(fieldData)
        return await tool(
          data,
          id as string | undefined,
          where as string | undefined,
          draft as boolean,
          depth as number,
          overrideLock as boolean,
          filePath as string | undefined,
          overwriteExistingFiles as boolean,
          locale as string | undefined,
          fallbackLocale as string | undefined,
        )
      },
    )
  }
}
