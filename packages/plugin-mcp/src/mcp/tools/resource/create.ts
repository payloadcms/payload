import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { validateCollectionData, validateCollectionSlug } from '../../helpers/validation.js'
import { toolSchemas } from '../schemas.js'

export const createResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  collections: Partial<Record<string, true>>,
) => {
  const tool = async (collection: string, data: string, draft: boolean = false) => {
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
        data: parsedData,
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
ID: ${result.id}
Draft: ${draft}
---
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

  server.tool(
    'createResource',
    (() => {
      const collectionSlugs = Object.keys(collections || {})
      const baseDesc = toolSchemas.createResource.description.trim()
      const punctuated = baseDesc.endsWith('.') ? baseDesc : `${baseDesc}.`
      return `${punctuated} Possible collections are: ${collectionSlugs.join(', ')}`
    })(),
    toolSchemas.createResource.parameters.shape,
    async ({ collection, data, draft }) => {
      return await tool(collection, data, draft)
    },
  )
}
