import type { PayloadRequest, SanitizedPermissions } from 'payload'

import { getAccessResults } from 'payload'

import type { AuthorizedMCP, MCPItem } from '../types.js'

import { getPluginConfig } from '../utils/getPluginConfig.js'

export type GetAuthorizedMCPArgs = {
  overrideAccess: boolean
  req: PayloadRequest
}

/**
 * Resolves the MCP caller and returns the MCP surface authorized for that request.
 *
 * Authorization has two layers:
 * 1. Payload collection/global permissions determine whether built-in operation tools are shown.
 * 2. MCP `access` callbacks can further hide any configured tool, prompt, or resource.
 *
 * Like Payload core operations, `overrideAccess` skips both layers.
 */
export const getAuthorizedMCP: (args: GetAuthorizedMCPArgs) => Promise<AuthorizedMCP> = async ({
  overrideAccess,
  req,
}) => {
  const pluginConfig = getPluginConfig({ config: req.payload.config })

  if (pluginConfig.overrideGetAuthorizedMCP) {
    return await pluginConfig.overrideGetAuthorizedMCP({
      overrideAccess,
      pluginConfig,
      req,
    })
  }

  req.user = req.headers
    ? (await req.payload.auth({ headers: new Headers(req.headers), req })).user
    : req.user

  return {
    items: await filterMCPItems({
      items: pluginConfig.items,
      overrideAccess,
      req,
    }),
    overrideAccess,
    user: req.user,
  }
}

export const filterMCPItems = async ({
  items,
  overrideAccess,
  req,
}: {
  items: MCPItem[]
  overrideAccess: boolean
  req: PayloadRequest
}): Promise<MCPItem[]> => {
  // Match Payload core: overrideAccess bypasses access evaluation instead of
  // forcing each access function to return true.
  if (overrideAccess) {
    return items
  }

  const authorizedItems: MCPItem[] = []

  const permissions = await getAccessResults({ req })

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
