import type { McpServer } from '@modelcontextprotocol/server'

import { fromJsonSchema } from '@modelcontextprotocol/server'
import { type PayloadRequest } from 'payload'

import type { MCPAccess } from '../types.js'

import { toCamelCase } from '../utils/camelCase.js'
import { getLogger } from '../utils/getLogger.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'
import { registerTool } from './helpers/registerTool.js'

export const registerCustomItems: (args: {
  mcpAccess: MCPAccess
  req: PayloadRequest
  server: McpServer
}) => void = ({ mcpAccess, req, server }) => {
  const { payload } = req
  const pluginConfig = getPluginConfig({ config: payload.config })
  const logger = getLogger({ payload })

  const customMCPTools = pluginConfig.mcp?.tools || []
  const customMCPPrompts = pluginConfig.mcp?.prompts || []
  const customMCPResources = pluginConfig.mcp?.resources || []

  // Handler wrapper that injects req before the _extra argument
  const wrapHandler = (handler: (...args: any[]) => any) => {
    return async (...args: any[]) => {
      const _extra = args[args.length - 1]
      const handlerArgs = args.slice(0, -1)
      return await handler(...handlerArgs, req, _extra)
    }
  }

  // Custom tools
  for (const tool of customMCPTools) {
    const camelCasedToolName = toCamelCase(tool.name)
    const isToolEnabled = mcpAccess['payload-mcp-tool']?.[camelCasedToolName] !== false

    registerTool({
      isEnabled: isToolEnabled,
      payload,
      registrationFn: () =>
        server.registerTool(
          tool.name,
          {
            description: tool.description,
            inputSchema: fromJsonSchema(tool.parameters as Parameters<typeof fromJsonSchema>[0]),
          },
          wrapHandler(tool.handler),
        ),
      toolType: tool.name,
    })
  }

  // Custom prompts
  for (const prompt of customMCPPrompts) {
    const camelCasedPromptName = toCamelCase(prompt.name)
    const isPromptEnabled = mcpAccess['payload-mcp-prompt']?.[camelCasedPromptName] !== false

    if (isPromptEnabled) {
      server.registerPrompt(
        prompt.name,
        {
          argsSchema: fromJsonSchema(prompt.argsSchema as Parameters<typeof fromJsonSchema>[0]),
          description: prompt.description,
          title: prompt.title,
        },
        wrapHandler(prompt.handler),
      )
      logger.info(`✅ Prompt: ${prompt.title} Registered.`)
    } else {
      logger.info(`⏭️ Prompt: ${prompt.title} Skipped.`)
    }
  }

  // Custom resources
  for (const resource of customMCPResources) {
    const camelCasedResourceName = toCamelCase(resource.name)
    const isResourceEnabled = mcpAccess['payload-mcp-resource']?.[camelCasedResourceName] !== false

    if (isResourceEnabled) {
      server.registerResource(
        resource.name,
        // @ts-expect-error - Overload type is not working however -- ResourceTemplate OR String is a valid type
        resource.uri,
        {
          description: resource.description,
          mimeType: resource.mimeType,
          title: resource.title,
        },
        wrapHandler(resource.handler),
      )

      logger.info(`✅ Resource: ${resource.title} Registered.`)
    } else {
      logger.info(`⏭️ Resource: ${resource.title} Skipped.`)
    }
  }
}
