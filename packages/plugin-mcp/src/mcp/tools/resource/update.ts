import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CollectionConfig, PayloadRequest } from 'payload'

import { z } from 'zod'

import type { PluginMCPServerConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { convertFieldsToZod } from '../../../utils/convertFieldsToZod.js'
import { toolSchemas } from '../schemas.js'
export const updateResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  collectionSlug: string,
  collections: PluginMCPServerConfig['collections'],
  collectionConfig: CollectionConfig,
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
  ) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Updating resource in collection: ${collectionSlug}${id ? ` with ID: ${id}` : ' with where clause'}, draft: ${draft}`,
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
        return {
          content: [{ type: 'text' as const, text: 'Error: Invalid JSON data provided' }],
        }
      }

      // Validate that either id or where is provided
      if (!id && !where) {
        payload.logger.error('[payload-mcp] Either id or where clause must be provided')
        return {
          content: [
            { type: 'text' as const, text: 'Error: Either id or where clause must be provided' },
          ],
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
          return {
            content: [{ type: 'text' as const, text: 'Error: Invalid JSON in where clause' }],
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
          overrideAccess: true,
          overrideLock,
          ...(filePath && { filePath }),
          ...(overwriteExistingFiles && { overwriteExistingFiles }),
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

        return {
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

        return {
          content: [
            {
              type: 'text' as const,
              text: responseText,
            },
          ],
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(
        `[payload-mcp] Error updating resource in ${collectionSlug}: ${errorMessage}`,
      )

      return {
        content: [
          {
            type: 'text' as const,
            text: `Error updating resource in collection "${collectionSlug}": ${errorMessage}`,
          },
        ],
      }
    }
  }

  if (collections?.[collectionSlug]?.enabled) {
    const convertedFields = convertFieldsToZod(collectionConfig.fields)

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
      filePath: z.string().optional().describe('File path for file uploads'),
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

    if (verboseLogs) {
      req.payload.logger.info(
        `[payload-mcp] Generated update schema for collection: ${collectionSlug} with ${Object.keys(convertedFields.shape).length} fields`,
      )
    }

    server.tool(
      `update${collectionSlug.charAt(0).toUpperCase() + toCamelCase(collectionSlug).slice(1)}`,
      `${toolSchemas.updateResource.description.trim()}\n\n${collections?.[collectionSlug]?.description || ''}`,
      updateResourceSchema.shape,
      async ({
        id,
        depth,
        draft,
        filePath,
        overrideLock,
        overwriteExistingFiles,
        where,
        ...fieldData
      }) => {
        // Convert field data back to JSON string format expected by the tool
        const data = JSON.stringify(fieldData)
        return await tool(
          data,
          id,
          where,
          draft,
          depth,
          overrideLock,
          filePath,
          overwriteExistingFiles,
        )
      },
    )
  }
}
