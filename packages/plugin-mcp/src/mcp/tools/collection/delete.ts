import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { PayloadRequest } from 'payload'

import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'

import { toolSchemas } from '../schemas.js'

// Helper function for removing collection from config
const removeCollectionFromConfig = (configContent: string, collectionName: string): string => {
  // Simple implementation - find and remove the collection import and reference
  let updatedContent = configContent

  // Remove import statement
  const importRegex = new RegExp(
    `import\\s*{\\s*${collectionName}\\s*}\\s*from\\s*['"]\\./collections/${collectionName}['"];?\\s*\\n?`,
    'g',
  )
  updatedContent = updatedContent.replace(importRegex, '')

  // Remove from collections array
  const collectionsRegex = new RegExp(`\\s*${collectionName},?\\s*`, 'g')
  updatedContent = updatedContent.replace(collectionsRegex, '')

  return updatedContent
}

export const deleteCollection = (
  req: PayloadRequest,
  verboseLogs: boolean,
  collectionsDirPath: string,
  configFilePath: string,
  collectionName: string,
  confirmDeletion: boolean,
  updateConfig: boolean,
) => {
  const payload = req.payload

  if (verboseLogs) {
    payload.logger.info(`[payload-mcp] Attempting to delete collection: ${collectionName}`)
  }

  if (!confirmDeletion) {
    payload.logger.warn(`[payload-mcp] Deletion cancelled for collection: ${collectionName}`)
    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ **Deletion cancelled**. Set confirmDeletion to true to proceed with deleting collection "${collectionName}".`,
        },
      ],
    }
  }

  const capitalizedName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1)
  const collectionFilePath = join(collectionsDirPath, `${capitalizedName}.ts`)

  // Security check: ensure we're working with the collections directory
  if (!collectionFilePath.startsWith(collectionsDirPath)) {
    payload.logger.error(`[payload-mcp] Invalid collection path attempted: ${collectionFilePath}`)
    return {
      content: [
        {
          type: 'text' as const,
          text: '❌ **Error**: Invalid collection path',
        },
      ],
    }
  }

  try {
    // Check if collection file exists
    let fileExists = false
    try {
      readFileSync(collectionFilePath, 'utf8')
      fileExists = true
    } catch {
      payload.logger.warn(`[payload-mcp] Collection file does not exist: ${collectionFilePath}`)
    }

    // Read current config if we need to update it
    let configContent = ''
    let configExists = false
    if (updateConfig) {
      try {
        configContent = readFileSync(configFilePath, 'utf8')
        configExists = true
      } catch {
        payload.logger.warn(`[payload-mcp] Config file does not exist: ${configFilePath}`)
      }
    }

    let responseText = ''
    let operationsPerformed = 0

    // Delete the collection file
    if (fileExists) {
      try {
        unlinkSync(collectionFilePath)
        if (verboseLogs) {
          payload.logger.info(
            `[payload-mcp] Successfully deleted collection file: ${collectionFilePath}`,
          )
        }
        responseText += `✅ Deleted collection file: \`${capitalizedName}.ts\`\n`
        operationsPerformed++
      } catch (error) {
        const errorMessage = (error as Error).message
        payload.logger.error(`[payload-mcp] Error deleting collection file: ${errorMessage}`)
        responseText += `❌ Error deleting collection file: ${errorMessage}\n`
      }
    } else {
      responseText += `⚠️ Collection file not found: \`${capitalizedName}.ts\`\n`
    }

    // Update the config file if requested and it exists
    if (updateConfig && configExists) {
      try {
        const updatedConfigContent = removeCollectionFromConfig(configContent, capitalizedName)
        writeFileSync(configFilePath, updatedConfigContent, 'utf8')
        if (verboseLogs) {
          payload.logger.info(`[payload-mcp] Successfully updated config file: ${configFilePath}`)
        }
        responseText += `✅ Updated payload.config.ts to remove collection reference\n`
        operationsPerformed++
      } catch (error) {
        const errorMessage = (error as Error).message
        payload.logger.error(`[payload-mcp] Error updating config file: ${errorMessage}`)
        responseText += `❌ Error updating config file: ${errorMessage}\n`
      }
    } else if (updateConfig && !configExists) {
      responseText += `⚠️ Config file not found: payload.config.ts\n`
    }

    // Summary
    if (operationsPerformed > 0) {
      responseText += `\n✅ **Collection deletion completed!**`
    } else {
      responseText += `\n⚠️ **No operations performed**

The collection file may not have existed or there were errors during deletion.`
    }

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
    payload.logger.error(`[payload-mcp] Error during collection deletion: ${errorMessage}`)
    return {
      content: [
        {
          type: 'text' as const,
          text: `❌ **Error during collection deletion**: ${errorMessage}`,
        },
      ],
    }
  }
}

export const deleteCollectionTool = (
  server: McpServer,
  req: PayloadRequest,
  verboseLogs: boolean,
  collectionsDirPath: string,
  configFilePath: string,
) => {
  const tool = (
    collectionName: string,
    confirmDeletion: boolean,
    updateConfig: boolean = false,
  ) => {
    const payload = req.payload

    if (verboseLogs) {
      payload.logger.info(
        `[payload-mcp] Deleting collection: ${collectionName}, confirmDeletion: ${confirmDeletion}, updateConfig: ${updateConfig}`,
      )
    }

    try {
      const result = deleteCollection(
        req,
        verboseLogs,
        collectionsDirPath,
        configFilePath,
        collectionName,
        confirmDeletion,
        updateConfig,
      )

      if (verboseLogs) {
        payload.logger.info(`[payload-mcp] Collection deletion completed for: ${collectionName}`)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      payload.logger.error(
        `[payload-mcp] Error deleting collection ${collectionName}: ${errorMessage}`,
      )

      return {
        content: [
          {
            type: 'text' as const,
            text: `Error deleting collection "${collectionName}": ${errorMessage}`,
          },
        ],
      }
    }
  }

  server.registerTool(
    'deleteCollection',
    {
      description: toolSchemas.deleteCollection.description,
      inputSchema: toolSchemas.deleteCollection.parameters.shape,
    },
    ({ collectionName, confirmDeletion, updateConfig }) => {
      return tool(collectionName, confirmDeletion, updateConfig)
    },
  )
}
