import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { readFileSync, writeFileSync } from 'fs'

import {
  addCollectionToConfig,
  removeCollectionFromConfig,
  updateAdminConfig,
  updateDatabaseConfig,
  updatePluginsConfig,
} from '../../helpers/config.js'
import { toolSchemas } from '../schemas.js'

export const updateConfig = (
  req: PayloadRequest,
  verboseLogs: boolean,
  configFilePath: string,
  updateType: string,
  collectionName?: string,
  adminConfig?: any,
  databaseConfig?: any,
  pluginUpdates?: any,
  generalConfig?: any,
  newContent?: string,
) => {
  const payload = req.payload
  if (verboseLogs) {
    payload.logger.info(`[payload-mcp] Updating config with update type: ${updateType}`)
  }

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

  try {
    // Read current config
    let currentContent: string
    try {
      currentContent = readFileSync(configFilePath, 'utf8')
    } catch (_ignore) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ **Error**: Config file not found: ${configFilePath}`,
          },
        ],
      }
    }

    let updatedContent: string
    let updateSummary: string[] = []

    switch (updateType) {
      case 'add_collection':
        if (!collectionName) {
          return {
            content: [
              {
                type: 'text' as const,
                text: '❌ **Error**: No collection name provided for add_collection update type',
              },
            ],
          }
        }
        updatedContent = addCollectionToConfig(currentContent, collectionName)
        updateSummary = [`Added collection: ${collectionName}`]
        break

      case 'remove_collection':
        if (!collectionName) {
          return {
            content: [
              {
                type: 'text' as const,
                text: '❌ **Error**: No collection name provided for remove_collection update type',
              },
            ],
          }
        }
        updatedContent = removeCollectionFromConfig(currentContent, collectionName)
        updateSummary = [`Removed collection: ${collectionName}`]
        break

      case 'replace_content':
        if (!newContent) {
          return {
            content: [
              {
                type: 'text' as const,
                text: '❌ **Error**: No new content provided for replace_content update type',
              },
            ],
          }
        }
        updatedContent = newContent
        updateSummary = ['Replaced entire config content']
        break

      case 'update_admin':
        if (!adminConfig) {
          return {
            content: [
              {
                type: 'text' as const,
                text: '❌ **Error**: No admin config provided for update_admin update type',
              },
            ],
          }
        }
        updatedContent = updateAdminConfig(currentContent, adminConfig)
        updateSummary = Object.keys(adminConfig).map((key) => `Updated admin config: ${key}`)
        break

      case 'update_database':
        if (!databaseConfig) {
          return {
            content: [
              {
                type: 'text' as const,
                text: '❌ **Error**: No database config provided for update_database update type',
              },
            ],
          }
        }
        updatedContent = updateDatabaseConfig(currentContent, databaseConfig)
        updateSummary = Object.keys(databaseConfig).map((key) => `Updated database config: ${key}`)
        break

      case 'update_plugins':
        if (!pluginUpdates) {
          return {
            content: [
              {
                type: 'text' as const,
                text: '❌ **Error**: No plugin updates provided for update_plugins update type',
              },
            ],
          }
        }
        updatedContent = updatePluginsConfig(currentContent, pluginUpdates)
        updateSummary = []
        if (pluginUpdates.add) {
          updateSummary.push(`Added plugins: ${pluginUpdates.add.join(', ')}`)
        }
        if (pluginUpdates.remove) {
          updateSummary.push(`Removed plugins: ${pluginUpdates.remove.join(', ')}`)
        }
        break

      default:
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ **Error**: Unknown update type: ${updateType}`,
            },
          ],
        }
    }

    // Write the updated content back to the file
    writeFileSync(configFilePath, updatedContent, 'utf8')
    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Successfully updated config file: ${configFilePath}`)
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ **Config updated successfully!**

**File**: \`${configFilePath}\`
**Update Type**: ${updateType}

**Changes Made**:
${updateSummary.map((summary) => `- ${summary}`).join('\n')}

**Updated Config Content:**
\`\`\`typescript
${updatedContent}
\`\`\``,
        },
      ],
    }
  } catch (error) {
    const errorMessage = (error as Error).message
    payload.logger.error(`[payload-mcp] Error updating config: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ **Error updating config**: ${errorMessage}`,
        },
      ],
    }
  }
}

export const updateConfigTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  configFilePath: string,
) => {
  const tool = ({
    adminConfig,
    collectionName,
    databaseConfig,
    generalConfig,
    newContent,
    pluginUpdates,
    updateType,
  }: {
    adminConfig?: any
    collectionName?: string
    databaseConfig?: any
    generalConfig?: any
    newContent?: string
    pluginUpdates?: any
    updateType: string
  }) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(`[payload-mcp] Updating config: ${updateType}`)
    }

    try {
      const result = updateConfig(
        req,
        verboseLogs,
        configFilePath,
        updateType,
        collectionName,
        adminConfig,
        databaseConfig,
        pluginUpdates,
        generalConfig,
        newContent,
      )

      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Config update completed for: ${updateType}`)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(`[payload-mcp] Error updating config: ${errorMessage}`)

      return {
        content: [
          {
            type: 'text' as const,
            text: `Error updating config: ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.tool(
    'updateConfig',
    toolSchemas.updateConfig.description,
    toolSchemas.updateConfig.parameters.shape,
    (args) => {
      return tool(args)
    },
  )
}
