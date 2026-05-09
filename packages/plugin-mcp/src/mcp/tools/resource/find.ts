import type { McpServer } from '@modelcontextprotocol/server'
import type { PayloadRequest, SelectType, TypedUser } from 'payload'

import type { MCPPluginConfig } from '../../../types.js'

import { toCamelCase } from '../../../utils/camelCase.js'
import { getLogger } from '../../../utils/getLogger.js'
import { zodToInputSchema } from '../../helpers/zodToInputSchema.js'
import { toolSchemas } from '../schemas.js'

export const findResourceTool = (
  server: McpServer,
  req: PayloadRequest,
  user: TypedUser,
  collectionSlug: string,
  collections: MCPPluginConfig['collections'],
) => {
  const tool = async (
    id?: number | string,
    limit: number = 10,
    page: number = 1,
    sort?: string,
    where?: string,
    select?: string,
    depth: number = 0,
    locale?: string,
    fallbackLocale?: string,
    draft?: boolean,
  ): Promise<{
    content: Array<{
      text: string
      type: 'text'
    }>
  }> => {
    const payload = req.payload
    const logger = getLogger({ payload })

    logger.info(
      `Reading resource from collection: ${collectionSlug}${id ? ` with ID: ${id}` : ''}, limit: ${limit}, page: ${page}${locale ? `, locale: ${locale}` : ''}`,
    )

    try {
      // Parse where clause if provided
      let whereClause = {}
      if (where) {
        try {
          whereClause = JSON.parse(where)
          logger.info(`Using where clause: ${where}`)
        } catch (_parseError) {
          logger.warn(`Invalid where clause JSON: ${where}`)
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

      // Parse select clause if provided
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

      // If ID is provided, use findByID
      if (id) {
        try {
          const doc = await payload.findByID({
            id,
            collection: collectionSlug,
            depth,
            ...(selectClause && { select: selectClause }),
            overrideAccess: false,
            req,
            user,
            ...(locale && { locale }),
            ...(fallbackLocale && { fallbackLocale }),
            ...(draft !== undefined && { draft }),
          })

          logger.info(`Found document with ID: ${id}`)

          const response = {
            content: [
              {
                type: 'text' as const,
                text: `Resource from collection "${collectionSlug}":
${JSON.stringify(doc)}`,
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
          logger.warn(`Document not found with ID: ${id} in collection: ${collectionSlug}`)
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
        depth,
        limit,
        overrideAccess: false,
        page,
        req,
        user,
        ...(selectClause && { select: selectClause }),
        ...(locale && { locale }),
        ...(fallbackLocale && { fallbackLocale }),
        ...(draft !== undefined && { draft }),
      }

      if (sort) {
        findOptions.sort = sort
      }

      if (Object.keys(whereClause).length > 0) {
        findOptions.where = whereClause
      }

      const result = await payload.find(findOptions)

      logger.info(`Found ${result.docs.length} documents in collection: ${collectionSlug}`)

      let responseText = `Collection: "${collectionSlug}"
Total: ${result.totalDocs} documents
Page: ${result.page} of ${result.totalPages}
`

      for (const doc of result.docs) {
        responseText += `\n\`\`\`json\n${JSON.stringify(doc)}\n\`\`\``
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
      logger.error(`Error reading resources from collection ${collectionSlug}: ${errorMessage}`)
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
    server.registerTool(
      `find${collectionSlug.charAt(0).toUpperCase() + toCamelCase(collectionSlug).slice(1)}`,
      {
        description: `${collections?.[collectionSlug]?.description || toolSchemas.findResources.description.trim()}`,
        inputSchema: zodToInputSchema(toolSchemas.findResources.parameters),
      },
      async ({
        id,
        depth,
        draft,
        fallbackLocale,
        limit,
        locale,
        page,
        select,
        sort,
        where,
      }: any) => {
        return await tool(
          id,
          limit,
          page,
          sort,
          where,
          select,
          depth,
          locale,
          fallbackLocale,
          draft,
        )
      },
    )
  }
}
