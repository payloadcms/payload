import type { PayloadRequest, SanitizedPermissions } from 'payload'

import { getAccessResults, UnauthorizedError } from 'payload'

import type { AuthorizedMCP, MCPItem } from '../types.js'

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
      items: await filterMCPItems({
        checkPermissions: false,
        items: pluginConfig.items,
        req,
      }),
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
   * Whether to pass Payload permissions into item access callbacks.
   */
  checkPermissions: boolean
  items: MCPItem[]
  req: PayloadRequest
}): Promise<MCPItem[]> => {
  const authorizedItems: MCPItem[] = []

  const permissions = checkPermissions ? await getAccessResults({ req }) : undefined

  for (const item of items) {
    if (!(await checkItemAccess({ item, permissions, req }))) {
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
  permissions,
  req,
}: {
  item: MCPItem
  permissions?: SanitizedPermissions
  req: PayloadRequest
}): Promise<boolean> => {
  if (item.type === 'collectionTool') {
    if (
      item.tool.access &&
      !(await item.tool.access({
        collectionSlug: item.collectionSlug,
        permissions,
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
        permissions,
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

    if (access && !(await access({ permissions, req }))) {
      return false
    }
  }

  return true
}
