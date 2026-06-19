import type { PayloadRequest, SanitizedPermissions } from 'payload'

import { getAccessResults, UnauthorizedError } from 'payload'

import type { AuthorizedMCP, MCPItem } from '../types.js'

import {
  COLLECTION_BUILTINS,
  GLOBAL_BUILTINS,
  type MCPCollectionBuiltinName,
  type MCPGlobalBuiltinName,
} from '../mcp/builtinTools.js'
import { getLogger } from '../utils/getLogger.js'
import { getPluginConfig } from '../utils/getPluginConfig.js'

export type GetAuthorizedMCPArgs = {
  req: PayloadRequest
  skipAuth?: boolean
}

/**
 * Resolves the MCP caller and returns the MCP surface authorized for that request.
 *
 * Authorization has two layers:
 * 1. Payload collection/global permissions determine whether built-in operation tools are shown.
 * 2. MCP `access` callbacks can further hide any configured tool, prompt, or resource.
 */
export const getAuthorizedMCP: (args: GetAuthorizedMCPArgs) => Promise<AuthorizedMCP> = async ({
  req,
  skipAuth = false,
}) => {
  const logger = getLogger({ payload: req.payload })
  const pluginConfig = getPluginConfig({ config: req.payload.config })

  if (pluginConfig.overrideGetAuthorizedMCP) {
    return await pluginConfig.overrideGetAuthorizedMCP({
      pluginConfig,
      req,
      skipAuth,
    })
  }

  req.user = req.headers
    ? (await req.payload.auth({ headers: new Headers(req.headers), req })).user
    : req.user

  if (process.env.NODE_ENV === 'development' && !req.user) {
    logger.info('Dev mode: skipping API key check, using session user')
    return {
      items: pluginConfig.items,
      overrideAccess: true,
      user: req.user,
    }
  }

  if (!skipAuth && req.user?._strategy !== 'api-key') {
    throw new UnauthorizedError()
  }

  return {
    items: await filterMCPItems({
      checkPermissions: !skipAuth,
      items: pluginConfig.items,
      req,
    }),
    overrideAccess: skipAuth,
    user: req.user,
  }
}

export const filterMCPItems = async ({
  checkPermissions,
  items,
  req,
}: {
  /**
   * Whether to check if the user has access to the underlying collection/global for built-in tools.
   */
  checkPermissions: boolean
  items: MCPItem[]
  req: PayloadRequest
}): Promise<MCPItem[]> => {
  const authorizedItems: MCPItem[] = []

  const permissions = checkPermissions ? await getAccessResults({ req }) : undefined

  for (const item of items) {
    if (!(await checkItemAccess({ item, req }))) {
      continue
    }
    if (permissions && !checkItemPermissions({ item, permissions })) {
      continue
    }
    authorizedItems.push(item)
  }

  return authorizedItems
}

/**
 * Runs MCP item access callbacks
 */
const checkItemAccess = async ({
  item,
  req,
}: {
  item: MCPItem
  req: PayloadRequest
}): Promise<boolean> => {
  if (item.type === 'collectionTool') {
    if (
      item.tool.access &&
      !(await item.tool.access({
        collectionSlug: item.collectionSlug,
        req,
      }))
    ) {
      return false
    }
  } else if (item.type === 'globalTool') {
    if (
      item.tool.access &&
      !(await item.tool.access({
        globalSlug: item.globalSlug,
        req,
      }))
    ) {
      return false
    }
  } else {
    const access =
      item.type === 'prompt'
        ? item.prompt.access
        : item.type === 'resource'
          ? item.resource.access
          : item.tool.access

    // Prompts, resources, and top-level tools only have the MCP access-callback layer.
    if (access && !(await access({ req }))) {
      return false
    }
  }

  return true
}

/**
 * Checks if built-in items have permissions for the current user
 */
const checkItemPermissions = ({
  item,
  permissions,
}: {
  item: MCPItem
  permissions: SanitizedPermissions
}): boolean => {
  if (item.type === 'collectionTool') {
    // Built-in collection tools map to Payload collection operations.
    // Custom collection tools have no operation gate here.
    const operation =
      COLLECTION_BUILTINS[item.configKey as MCPCollectionBuiltinName]?.accessOperation

    if (operation && !permissions.collections?.[item.collectionSlug]?.[operation]) {
      return false
    }
  } else if (item.type === 'globalTool') {
    // Built-in global tools map to Payload global operations.
    // Custom global tools have no operation gate here.
    const operation = GLOBAL_BUILTINS[item.configKey as MCPGlobalBuiltinName]?.accessOperation

    if (operation && !permissions.globals?.[item.globalSlug]?.[operation]) {
      return false
    }
  }

  return true
}
