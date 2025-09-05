import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { validateCollectionSlug } from '../../helpers/validation.js'
import { toolSchemas } from '../schemas.js'

export const updateResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  collections: Partial<Record<string, true>>,
) => {
  const tool = async (
    collection: string,
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

    const validationError = validateCollectionSlug(collection, collections)
    if (validationError) {
      payload.logger.warn(`[payload-mcp] Validation error for ${collection}: ${validationError}`)
      return {
        content: [{ type: 'text' as const, text: `Validation Error: ${validationError}` }],
      }
    }

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Updating resource in collection: ${collection}${id ? ` with ID: ${id}` : ' with where clause'}, draft: ${draft}`,
      )
    }

    try {
      // Parse the data JSON
      let parsedData: Record<string, unknown>
      try {
        parsedData = JSON.parse(data)
        if (verboseLogs) {
          payload.logger.info(
            `[payload-mcp] Parsed data for ${collection}: ${JSON.stringify(parsedData)}`,
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
          collection,
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
        const result = await payload.update(
          updateOptions as unknown as Parameters<typeof payload.update>[0],
        )

        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Successfully updated document with ID: ${id}`)
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `Document updated successfully in collection "${collection}"!
ID: ${result.id}
Draft: ${draft}
---
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
          collection,
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
        const result = await payload.update(
          updateOptions as unknown as Parameters<typeof payload.update>[0],
        )

        const bulkResult = result as { docs?: unknown[]; errors?: unknown[] }
        const docs = bulkResult.docs || []
        const errors = bulkResult.errors || []

        if (verboseLogs) {
          payload.logger.info(
            `[payload-mcp] Successfully updated ${docs.length} documents, ${errors.length} errors`,
          )
        }

        let responseText = `Multiple documents updated in collection "${collection}"!
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
        `[payload-mcp] Error updating resource in ${collection}: ${errorMessage}`,
      )

      return {
        content: [
          {
            type: 'text' as const,
            text: `Error updating resource in collection "${collection}": ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.tool(
    'updateResource',
    (() => {
      const collectionSlugs = Object.keys(collections || {})
      const baseDesc = toolSchemas.updateResource.description.trim()
      const punctuated = baseDesc.endsWith('.') ? baseDesc : `${baseDesc}.`
      return `${punctuated} Possible collections are: ${collectionSlugs.join(', ')}`
    })(),
    toolSchemas.updateResource.parameters.shape,
    async ({
      id,
      collection,
      data,
      depth,
      draft,
      filePath,
      overrideLock,
      overwriteExistingFiles,
      where,
    }) => {
      return await tool(
        collection,
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
