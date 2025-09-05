import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import type { PluginMCPServerConfig } from '../../../types.js'

import { validateCollectionData, validateCollectionSlug } from '../../helpers/validation.js'
import { toolSchemas } from '../schemas.js'

export const createResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  collections: PluginMCPServerConfig['collections'],
) => {
  const tool = async (collection: string, data: string, draft: boolean = false) => {
    const payload = req.payload

    const collectionKeys = Object.keys(collections || {})
    const collectionNames = collectionKeys.reduce(
      (acc, key) => {
        acc[key] = true
        return acc
      },
      {} as Record<string, true>,
    )
    const validationError = validateCollectionSlug(collection, collectionNames)
    if (validationError) {
      payload.logger.warn(`[payload-mcp] Validation error for ${collection}: ${validationError}`)
      return {
        content: [{ type: 'text' as const, text: `Validation Error: ${validationError}` }],
      }
    }

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Creating resource in collection: ${collection}, draft: ${draft}`,
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

      // Validate required fields based on collection
      const collectionSlugs = Object.keys(collections || {})
      const validationError = validateCollectionData(collection, parsedData, collectionSlugs)
      if (validationError) {
        payload.logger.warn(`[payload-mcp] Validation error for ${collection}: ${validationError}`)
        return {
          content: [{ type: 'text' as const, text: `Validation Error: ${validationError}` }],
        }
      }

      // Create the resource
      const result = await payload.create({
        collection,
        data: collections?.[collection]?.override?.(parsedData, req) || parsedData,
        draft,
        overrideAccess: true,
      })

      if (verboseLogs) {
        payload.logger.info(
          `[payload-mcp] Successfully created resource in ${collection} with ID: ${result.id}`,
        )
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `Resource created successfully in collection "${collection}"!
Created resource:
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``,
          },
        ],
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(
        `[payload-mcp] Error creating resource in ${collection}: ${errorMessage}`,
      )

      return {
        content: [
          {
            type: 'text' as const,
            text: `Error creating resource in collection "${collection}": ${errorMessage}`,
          },
        ],
      }
    }
  }
  const collectionSlugs = Object.keys(collections || {})
  collectionSlugs.forEach((collectionSlug) => {
    if (!collections?.[collectionSlug]?.enabled) {
      return
    }

    server.tool(
      `create${collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1)}Document`,
      `${toolSchemas.createResource.description.trim()}\n\n${collections?.[collectionSlug]?.description}`,
      toolSchemas.createResource.parameters.shape,
      async ({ collection, data, draft }) => {
        return await tool(collection, data, draft)
      },
    )
  })
}
