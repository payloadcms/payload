import type { McpServer } from '@modelcontextprotocol/server'

import { APIError, configToJSONSchema, type PayloadRequest } from 'payload'

import type { JsonSchemaObject, MCPAccess } from '../types.js'

import { toCamelCase } from '../utils/camelCase.js'
import { getEnabledCollectionSlugs } from '../utils/disabledHelpers.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'
import { getCollectionVirtualFieldNames } from '../utils/getVirtualFieldNames.js'
import { removeVirtualFieldsFromSchema } from '../utils/schemaConversion/removeVirtualFieldsFromSchema.js'
import { registerTool } from './helpers/registerTool.js'
import { createDocumentTool } from './tools/collections/create.js'
import { deleteDocumentTool } from './tools/collections/delete.js'
import { findDocumentTool } from './tools/collections/find.js'
import { updateDocumentTool } from './tools/collections/update.js'

export const registerCollectionTools: (args: {
  mcpAccess: MCPAccess
  req: PayloadRequest
  server: McpServer
}) => void = ({ mcpAccess, req, server }) => {
  const { payload } = req
  const pluginConfig = getPluginConfig({ config: payload.config })

  const configSchema = configToJSONSchema(payload.config, payload.db.defaultIDType, req.i18n, {
    forceInlineBlocks: true,
  })

  const collectionsPluginConfig = pluginConfig.collections || {}

  try {
    {
      // Every collection is exposed by default — opt-out via plugin config or per-key checkboxes.
      const activeCollectionSlugs = getEnabledCollectionSlugs(
        payload.config.collections,
        collectionsPluginConfig,
      )

      // Collection Operation Tools
      for (const enabledCollectionSlug of activeCollectionSlugs) {
        try {
          const rawSchema = configSchema.definitions?.[enabledCollectionSlug] as JsonSchemaObject

          const virtualFieldNames = getCollectionVirtualFieldNames(
            payload.config,
            enabledCollectionSlug,
          )
          const schema = removeVirtualFieldsFromSchema(
            JSON.parse(JSON.stringify(rawSchema)) as JsonSchemaObject,
            virtualFieldNames,
          )

          // Plugin-config disables are already folded into `mcpAccess` (see
          // `applyPluginDisables` in the endpoint), so the only check left here is
          // whether the merged access has explicitly disabled the op.
          const slugAccess = mcpAccess?.[`${toCamelCase(enabledCollectionSlug)}`]
          const isAllowed = (op: 'create' | 'delete' | 'find' | 'update'): boolean =>
            slugAccess?.[op] !== false
          const allowCreate = isAllowed('create')
          const allowUpdate = isAllowed('update')
          const allowFind = isAllowed('find')
          const allowDelete = isAllowed('delete')

          if (allowCreate) {
            registerTool({
              isEnabled: allowCreate,
              payload,
              registrationFn: () =>
                createDocumentTool(
                  server,
                  req,
                  mcpAccess,
                  enabledCollectionSlug,
                  collectionsPluginConfig,
                  schema,
                ),
              toolType: `Create ${enabledCollectionSlug}`,
            })
          }
          if (allowUpdate) {
            registerTool({
              isEnabled: allowUpdate,
              payload,
              registrationFn: () =>
                updateDocumentTool(
                  server,
                  req,
                  mcpAccess,
                  enabledCollectionSlug,
                  collectionsPluginConfig,
                  schema,
                ),
              toolType: `Update ${enabledCollectionSlug}`,
            })
          }
          if (allowFind) {
            registerTool({
              isEnabled: allowFind,
              payload,
              registrationFn: () =>
                findDocumentTool(
                  server,
                  req,
                  mcpAccess,
                  enabledCollectionSlug,
                  collectionsPluginConfig,
                ),
              toolType: `Find ${enabledCollectionSlug}`,
            })
          }
          if (allowDelete) {
            registerTool({
              isEnabled: allowDelete,
              payload,
              registrationFn: () =>
                deleteDocumentTool(
                  server,
                  req,
                  mcpAccess,
                  enabledCollectionSlug,
                  collectionsPluginConfig,
                ),
              toolType: `Delete ${enabledCollectionSlug}`,
            })
          }
        } catch (error) {
          throw new APIError(
            `Error registering tools for collection ${enabledCollectionSlug}: ${String(error)}`,
            500,
          )
        }
      }
    }
  } catch (error) {
    throw new APIError(`Error initializing MCP handler: ${String(error)}`, 500)
  }
}
