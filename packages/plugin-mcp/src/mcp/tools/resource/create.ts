import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { JSONSchema4 } from 'json-schema'
import type { PayloadRequest } from 'payload'

import type { PluginMCPServerConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { convertCollectionSchemaToZod } from '../../../utils/convertCollectionSchemaToZod.js'
import { toolSchemas } from '../schemas.js'
export const createResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  collectionSlug: string,
  collections: PluginMCPServerConfig['collections'],
  schema: JSONSchema4,
) => {
  const tool = async (data: string) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Creating resource in collection: ${collectionSlug}`)
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

      // Create the resource
      const result = await payload.create({
        collection: collectionSlug,
        data: collections?.[collectionSlug]?.override?.(parsedData, req) || parsedData,
        overrideAccess: true,
      })

      if (verboseLogs) {
        payload.logger.info(
          `[payload-mcp] Successfully created resource in ${collectionSlug} with ID: ${result.id}`,
        )
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `Resource created successfully in collection "${collectionSlug}"!
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
        `[payload-mcp] Error creating resource in ${collectionSlug}: ${errorMessage}`,
      )

      return {
        content: [
          {
            type: 'text' as const,
            text: `Error creating resource in collection "${collectionSlug}": ${errorMessage}`,
          },
        ],
      }
    }
  }

  if (collections?.[collectionSlug]?.enabled) {
    const convertedFields = convertCollectionSchemaToZod(schema)

    server.tool(
      `create${collectionSlug.charAt(0).toUpperCase() + toCamelCase(collectionSlug).slice(1)}`,
      `${toolSchemas.createResource.description.trim()}\n\n${collections?.[collectionSlug]?.description || ''}`,
      convertedFields.shape,
      async (params: Record<string, unknown>) => {
        const data = JSON.stringify(params)
        return await tool(data)
      },
    )
  }
}
