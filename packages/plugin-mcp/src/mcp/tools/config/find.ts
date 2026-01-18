import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from '@ruya.sa/payload'

import { readFileSync, statSync } from 'fs'

import { toolSchemas } from '../schemas.js'

export const readConfigFile = (
  req: PayloadRequest,
  verboseLogs: boolean,
  configFilePath: string,
  includeMetadata: boolean = false,
) => {
  const payload = req.payload
  if (verboseLogs) {
    payload.logger.info(`[payload-mcp] Reading config file, includeMetadata: ${includeMetadata}`)
  }

  try {
    // Security check: ensure we're working with the specified config file
    if (!configFilePath.startsWith(process.cwd()) && !configFilePath.startsWith('/')) {
      payload.logger.error(`[payload-mcp] Invalid config path attempted: ${configFilePath}`)
      return {
        content: [
          {
            type: 'text' as const,
            text: '❌ **Error**: Invalid config path',
          },
        ],
      }
    }

    const content = readFileSync(configFilePath, 'utf8')
    const stats = statSync(configFilePath)

    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Successfully read config file. Size: ${stats.size} bytes`)
    }

    let responseText = `# Payload Configuration

**File**: \`${configFilePath}\``

    if (includeMetadata) {
      responseText += `
**Size**: ${stats.size.toLocaleString()} bytes
**Modified**: ${stats.mtime.toISOString()}
**Created**: ${stats.birthtime.toISOString()}`
    }

    responseText += `
---

**Configuration Content:**
\`\`\`typescript
${content}
\`\`\``

    return {
      content: [
        {
          type: 'text' as const,
          text: responseText,
        },
      ],
    }
  } catch (error) {
    const errorMessage = (error as Error).message
    payload.logger.error(`[payload-mcp] Error reading config file: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ **Error reading config file**: ${errorMessage}`,
        },
      ],
    }
  }
}

// MCP Server tool registration
export const findConfigTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  configFilePath: string,
) => {
  const tool = (includeMetadata: boolean = false) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Finding config, includeMetadata: ${includeMetadata}`)
    }

    try {
      const result = readConfigFile(req, verboseLogs, configFilePath, includeMetadata)

      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Config search completed`)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(`[payload-mcp] Error finding config: ${errorMessage}`)

      return {
        content: [
          {
            type: 'text' as const,
            text: `Error finding config: ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.tool(
    'findConfig',
    toolSchemas.findConfig.description,
    toolSchemas.findConfig.parameters.shape,
    ({ includeMetadata }) => {
      return tool(includeMetadata)
    },
  )
}
