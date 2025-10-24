import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest, TypedUser } from 'payload'

import type { PluginMCPServerConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { toolSchemas } from '../schemas.js'

export const findResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  user: TypedUser,
  verboseLogs: boolean,
  collectionSlug: string,
  collections: PluginMCPServerConfig['collections'],
) => {
  const tool = async (
    id?: string,
    limit: number = 10,
    page: number = 1,
    sort?: string,
    where?: string,
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
        `[payload-mcp] Reading resource from collection: ${collectionSlug}${id ? ` with ID: ${id}` : ''}, limit: ${limit}, page: ${page}${locale ? `, locale: ${locale}` : ''}`,
      )
    }

    try {
      // Parse where clause if provided
      let whereClause = {}
      if (where) {
        try {
          whereClause = JSON.parse(where)
          if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Using where clause: ${where}`)
          }
        } catch (_parseError) {
          payload.logger.warn(`[payload-mcp] Invalid where clause JSON: ${where}`)
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

      // If ID is provided, use findByID
      if (id) {
        try {
          const doc = await payload.findByID({
            id,
            collection: collectionSlug,
            user,
            ...(locale && { locale }),
            ...(fallbackLocale && { fallbackLocale }),
          })

          if (verboseLogs) {
            payload.logger.info(`[payload-mcp] Found document with ID: ${id}`)
          }

          const response = {
            content: [
              {
                type: 'text' as const,
                text: `Resource from collection "${collectionSlug}":
${JSON.stringify(doc, null, 2)}`,
              },
            ],
          }

          return (collections?.[collectionSlug]?.overrideResponse?.(response, doc, req) ||
            response) as {
            content: Array<{
              text: string
              type: 'text'
            }>
          }
        } catch (_findError) {
          payload.logger.warn(
            `[payload-mcp] Document not found with ID: ${id} in collection: ${collectionSlug}`,
          )
          const response = {
            content: [
              {
                type: 'text' as const,
                text: `Error: Document with ID "${id}" not found in collection "${collectionSlug}"`,
              },
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
      }

      // Otherwise, use find to get multiple documents
      const findOptions: Parameters<typeof payload.find>[0] = {
        collection: collectionSlug,
        limit,
        page,
        user,
        ...(locale && { locale }),
        ...(fallbackLocale && { fallbackLocale }),
      }

      if (sort) {
        findOptions.sort = sort
      }

      if (Object.keys(whereClause).length > 0) {
        findOptions.where = whereClause
      }

      const result = await payload.find(findOptions)

      if (verboseLogs) {
        payload.logger.info(
          `[payload-mcp] Found ${result.docs.length} documents in collection: ${collectionSlug}`,
        )
      }

      let responseText = `Collection: "${collectionSlug}"
Total: ${result.totalDocs} documents
Page: ${result.page} of ${result.totalPages}
`

      for (const doc of result.docs) {
        responseText += `\n\`\`\`json\n${JSON.stringify(doc, null, 2)}\n\`\`\``
      }

      const response = {
        content: [
          {
            type: 'text' as const,
            text: responseText,
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(
        `[payload-mcp] Error reading resources from collection ${collectionSlug}: ${errorMessage}`,
      )
      const response = {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Error reading resources from collection "${collectionSlug}":** ${errorMessage}`,
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
    server.tool(
      `find${collectionSlug.charAt(0).toUpperCase() + toCamelCase(collectionSlug).slice(1)}`,
      `${toolSchemas.findResources.description.trim()}\n\n${collections?.[collectionSlug]?.description || ''}`,
      toolSchemas.findResources.parameters.shape,
      async ({ id, fallbackLocale, limit, locale, page, sort, where }) => {
        return await tool(id, limit, page, sort, where, locale, fallbackLocale)
      },
    )
  }
}
