import type { McpServer } from '@modelcontextprotocol/server'

import { APIError, configToJSONSchema, type PayloadRequest } from 'payload'

import type { JsonSchemaObject, MCPAccess } from '../types.js'

import { toCamelCase } from '../utils/camelCase.js'
import { getEnabledGlobalSlugs } from '../utils/disabledHelpers.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'
import { getGlobalVirtualFieldNames } from '../utils/getVirtualFieldNames.js'
import { removeVirtualFieldsFromSchema } from '../utils/schemaConversion/removeVirtualFieldsFromSchema.js'
import { registerTool } from './helpers/registerTool.js'
import { findGlobalTool } from './tools/globals/find.js'
import { updateGlobalTool } from './tools/globals/update.js'

export const registerGlobalTools: (args: {
  mcpAccess: MCPAccess
  req: PayloadRequest
  server: McpServer
}) => void = ({ mcpAccess, req, server }) => {
  const { payload } = req
  const pluginConfig = getPluginConfig({ config: payload.config })

  const configSchema = configToJSONSchema(payload.config, payload.db.defaultIDType, req.i18n, {
    forceInlineBlocks: true,
  })

  const globalsPluginConfig = pluginConfig.globals || {}

  // Global Operation Tools — also opt-out by default
  const activeGlobalSlugs = getEnabledGlobalSlugs(payload.config.globals, globalsPluginConfig)

  activeGlobalSlugs.forEach((enabledGlobalSlug) => {
    try {
      const rawSchema = configSchema.definitions?.[enabledGlobalSlug] as JsonSchemaObject

      const virtualFieldNames = getGlobalVirtualFieldNames(payload.config, enabledGlobalSlug)
      const schema = removeVirtualFieldsFromSchema(
        JSON.parse(JSON.stringify(rawSchema)) as JsonSchemaObject,
        virtualFieldNames,
      )

      // Plugin-config disables are already folded into `mcpAccess` (see
      // `applyPluginDisables` in the endpoint), so the only check left here is
      // whether the merged access has explicitly disabled the op.
      const slugAccess = mcpAccess?.[`${toCamelCase(enabledGlobalSlug)}`] as
        | Record<string, unknown>
        | undefined
      const isAllowed = (op: 'find' | 'update'): boolean => slugAccess?.[op] !== false
      const allowFind = isAllowed('find')
      const allowUpdate = isAllowed('update')

      if (allowFind) {
        registerTool({
          isEnabled: allowFind,
          payload,
          registrationFn: () =>
            findGlobalTool(server, req, mcpAccess, enabledGlobalSlug, globalsPluginConfig),
          toolType: `Find ${enabledGlobalSlug}`,
        })
      }
      if (allowUpdate) {
        registerTool({
          isEnabled: allowUpdate,
          payload,
          registrationFn: () =>
            updateGlobalTool(
              server,
              req,
              mcpAccess,
              enabledGlobalSlug,
              globalsPluginConfig,
              schema,
            ),
          toolType: `Update ${enabledGlobalSlug}`,
        })
      }
    } catch (error) {
      throw new APIError(
        `Error registering tools for global ${enabledGlobalSlug}: ${String(error)}`,
        500,
      )
    }
  })
}
