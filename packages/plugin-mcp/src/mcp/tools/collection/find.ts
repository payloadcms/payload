import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { readdirSync, readFileSync, statSync } from 'fs'
import { extname, join } from 'path'

import { toolSchemas } from '../schemas.js'

export const readCollections = (
  req: PayloadRequest,
  verboseLogs: boolean,
  collectionsDirPath: string,
  collectionName?: string,
  includeContent: boolean = false,
  includeCount: boolean = false,
) => {
  const payload = req.payload

  if (verboseLogs) {
    payload.logger.info(
      `[payload-mcp] Reading collections${collectionName ? ` for: ${collectionName}` : ''}, includeContent: ${includeContent}, includeCount: ${includeCount}`,
    )
  }

  try {
    // Read specific Collection (optional)
    if (collectionName) {
      const fileName = `${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}.ts`
      const filePath = join(collectionsDirPath, fileName)

      if (!filePath.startsWith(collectionsDirPath)) {
        payload.logger.error(`[payload-mcp] Invalid collection name attempted: ${collectionName}`)
        return {
          content: [{ type: 'text' as const, text: 'Error: Invalid collection name' }],
        }
      }

      try {
        const content = readFileSync(filePath, 'utf8')
        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Successfully read collection: ${collectionName}`)
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `Collection: ${collectionName}
File: ${fileName}
---
${content}`,
            },
          ],
        }
      } catch (_error) {
        payload.logger.warn(`[payload-mcp] Collection not found: ${collectionName}`)
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: Collection '${collectionName}' not found`,
            },
          ],
        }
      }
    }

    // Read all Collections
    const files = readdirSync(collectionsDirPath)
      .filter((file) => extname(file) === '.ts')
      .sort()

    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Found ${files.length} collection files in directory`)
    }

    if (files.length === 0) {
      payload.logger.warn('[payload-mcp] No collection files found in src/collections directory')
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No collection files found in src/collections directory',
          },
        ],
      }
    }

    const results = []

    // Build complete table as a single markdown string
    let tableContent = `Found ${files.length} collection file(s):\n\n`

    // Build table header
    let tableHeader = '| Collection | File | Size | Modified'
    let tableSeparator = '|------------|------|------|----------'

    if (includeCount) {
      tableHeader += ' | Documents'
      tableSeparator += ' |----------'
    }
    tableHeader += ' |'
    tableSeparator += ' |'

    tableContent += tableHeader + '\n'
    tableContent += tableSeparator + '\n'

    for (const file of files) {
      const filePath = join(collectionsDirPath, file)
      const stats = statSync(filePath)
      const fileSize = stats.size
      const lastModified = stats.mtime

      const collectionName = file.replace('.ts', '')

      // Build table row
      let tableRow = `| **${collectionName}** | ${file} | ${fileSize.toLocaleString()} bytes | ${lastModified.toISOString()}`

      // Add document count if requested
      if (includeCount) {
        try {
          // For now, we'll skip document counting since we don't have access to payload instance
          tableRow += ' | -'
        } catch (error) {
          tableRow += ` | Error: ${(error as Error).message}`
        }
      }
      tableRow += ' |'

      tableContent += tableRow + '\n'

      if (includeContent) {
        try {
          const content = readFileSync(filePath, 'utf8')
          tableContent += `\n**${collectionName} Content:**\n\`\`\`typescript\n${content}\n\`\`\`\n\n`
        } catch (error) {
          tableContent += `\nError reading content: ${(error as Error).message}\n\n`
        }
      }
    }

    results.push({
      type: 'text' as const,
      text: tableContent,
    })

    return {
      content: results,
    }
  } catch (error) {
    const errorMessage = (error as Error).message
    payload.logger.error(`[payload-mcp] Error reading collections: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ **Error reading collections**: ${errorMessage}`,
        },
      ],
    }
  }
}

// MCP Server tool registration
export const findCollectionTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  collectionsDirPath: string,
) => {
  const tool = (
    collectionName?: string,
    includeContent: boolean = false,
    includeCount: boolean = false,
  ) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Finding collections${collectionName ? ` for: ${collectionName}` : ''}, includeContent: ${includeContent}, includeCount: ${includeCount}`,
      )
    }

    try {
      const result = readCollections(
        req,
        verboseLogs,
        collectionsDirPath,
        collectionName,
        includeContent,
        includeCount,
      )

      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Collection search completed`)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(`[payload-mcp] Error finding collections: ${errorMessage}`)

      return {
        content: [
          {
            type: 'text' as const,
            text: `Error finding collections: ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.tool(
    'findCollections',
    toolSchemas.findCollections.description,
    toolSchemas.findCollections.parameters.shape,
    ({ collectionName, includeContent, includeCount }) => {
      return tool(collectionName, includeContent, includeCount)
    },
  )
}
